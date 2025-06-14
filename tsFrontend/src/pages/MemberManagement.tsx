import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, X, Users } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { useIsMobile, BREAKPOINTS } from "@/hooks/use-mobile";
import MemberDetails from '@/components/MemberManagement/MemberDetails';
import { useToast } from "@/hooks/use-toast";
import AddMemberDialog from '@/components/MemberManagement/AddMemberDialog';
import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks/hooks';
import { 
  fetchMembers, 
  createMember, 
  updateMember, 
  deleteMember,
  setSelectedMember,
  clearSelectedMember
} from '@/store/member/memberSlice.ts';
import { Member, ProgramUI, BatchUI } from '@/types/member.ts';
import { fetchPrograms } from '@/store/program/programSlice';
import { formatBackendError } from '@/utils/errorHandling';

// Program Card Component
const ProgramSegmentCard: React.FC<{
  programName: string;
  memberCount: number;
  onClick: () => void;
  isActive: boolean;
  colorIndex: number;
}> = ({ programName, memberCount, onClick, isActive, colorIndex }) => {
  const colorClasses = [
    'bg-blue-50 border-blue-200 hover:bg-blue-100',
    'bg-green-50 border-green-200 hover:bg-green-100',
    'bg-purple-50 border-purple-200 hover:bg-purple-100',
    'bg-orange-50 border-orange-200 hover:bg-orange-100',
    'bg-yellow-50 border-yellow-200 hover:bg-yellow-100',
    'bg-pink-50 border-pink-200 hover:bg-pink-100',
    'bg-indigo-50 border-indigo-200 hover:bg-indigo-100',
    'bg-teal-50 border-teal-200 hover:bg-teal-100',
    'bg-red-50 border-red-200 hover:bg-red-100',
    'bg-gray-50 border-gray-200 hover:bg-gray-100',
  ];

  const getColorClass = () => {
    return colorClasses[colorIndex % colorClasses.length];
  };

  return (
    <div 
      onClick={onClick}
      className={`p-4 rounded-lg border cursor-pointer transition-all ${getColorClass()} ${
        isActive ? 'ring-2 ring-offset-2 ring-primary' : ''
      }`}
    >
      <h3 className="font-medium text-lg">{programName}</h3>
      <div className="flex items-center justify-between mt-2">
        <span className="text-sm text-gray-600">Members</span>
        <Badge variant="outline" className="font-medium">{memberCount}</Badge>
      </div>
    </div>
  );
};

// Batch Card Component
const BatchSegmentCard: React.FC<{
  batchName: string;
  memberCount: number;
  onClick: () => void;
  isActive: boolean;
  colorIndex: number;
}> = ({ batchName, memberCount, onClick, isActive, colorIndex }) => {
  const colorClasses = [
    'bg-blue-50 border-blue-200 hover:bg-blue-100',
    'bg-green-50 border-green-200 hover:bg-green-100',
    'bg-purple-50 border-purple-200 hover:bg-purple-100',
    'bg-orange-50 border-orange-200 hover:bg-orange-100',
    'bg-yellow-50 border-yellow-200 hover:bg-yellow-100',
    'bg-pink-50 border-pink-200 hover:bg-pink-100',
    'bg-indigo-50 border-indigo-200 hover:bg-indigo-100',
    'bg-teal-50 border-teal-200 hover:bg-teal-100',
    'bg-red-50 border-red-200 hover:bg-red-100',
    'bg-gray-50 border-gray-200 hover:bg-gray-100',
  ];

  const getColorClass = () => {
    return colorClasses[colorIndex % colorClasses.length];
  };

  return (
    <div 
      onClick={onClick}
      className={`p-4 rounded-lg border cursor-pointer transition-all ${getColorClass()} ${
        isActive ? 'ring-2 ring-offset-2 ring-primary' : ''
      }`}
    >
      <h3 className="font-medium text-lg">{batchName}</h3>
      <div className="flex items-center justify-between mt-2">
        <span className="text-sm text-gray-600">Members</span>
        <Badge variant="outline" className="font-medium">{memberCount}</Badge>
      </div>
    </div>
  );
};

const MemberManagement: React.FC = () => {
  const dispatch = useAppDispatch();
  const { members, selectedMember, loading } = useAppSelector((state) => state.members);
  const { programs } = useAppSelector((state) => state.programs);
  const { batches } = useAppSelector((state) => state.batch);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [activeProgram, setActiveProgram] = useState<number | null>(null);
  const [activeBatch, setActiveBatch] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"programs" | "batches">("programs");
  const [programsLoading, setProgramsLoading] = useState(false);
  const [batchesLoading, setBatchesLoading] = useState(false);
  
  const { toast } = useToast();
  const isMobile = useIsMobile(BREAKPOINTS.TABLET);

  // Load initial data only once
  useEffect(() => {
    // Only fetch if data isn't already in the Redux store
    dispatch(fetchMembers());
    dispatch(fetchPrograms());
  }, [dispatch]);

  // Calculate program statistics with correct unique member count
  const programStats = React.useMemo(() => {
    const stats = new Map<number, { name: string; count: number; memberIds: Set<number> }>();
    
    // Initialize with all programs from the Redux store
    programs.forEach(program => {
      stats.set(program.id, { name: program.name, count: 0, memberIds: new Set() });
    });
    
    // Count unique members in each program
    members.forEach(member => {
      if (member.batches) {
        member.batches.forEach(batch => {
          if (batch.program) {
            const programId = batch.program.id;
            const currentStats = stats.get(programId);
            if (currentStats) {
              currentStats.memberIds.add(member.id);
              stats.set(programId, { 
                ...currentStats, 
                count: currentStats.memberIds.size 
              });
            } else {
              const memberIds = new Set<number>([member.id]);
              stats.set(programId, { 
                name: batch.program.name, 
                count: 1,
                memberIds
              });
            }
          }
        });
      }
    });
    
    return Array.from(stats.entries()).map(([id, { name, count }]) => ({ id, name, count }));
  }, [members, programs]);

  // Calculate batch statistics with correct member count
  const batchStats = React.useMemo(() => {
    const stats = new Map<number, { name: string; count: number; memberIds: Set<number> }>();
    
    // Initialize with all batches from the Redux store
    batches.forEach(batch => {
      stats.set(batch.id, { name: batch.name, count: 0, memberIds: new Set() });
    });
    
    // Count unique members in each batch
    members.forEach(member => {
      if (member.batches) {
        member.batches.forEach(batch => {
          const currentStats = stats.get(batch.id);
          if (currentStats) {
            currentStats.memberIds.add(member.id);
            stats.set(batch.id, { 
              ...currentStats, 
              count: currentStats.memberIds.size 
            });
          } else {
            const memberIds = new Set<number>([member.id]);
            stats.set(batch.id, { 
              name: batch.name, 
              count: 1,
              memberIds
            });
          }
        });
      }
    });
    
    return Array.from(stats.entries()).map(([id, { name, count }]) => ({ id, name, count }));
  }, [members, batches]);
 
  const filteredMembers = React.useMemo(() => {
    return members.filter(member => {
      const matchesSearch = (member.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.mobile.includes(searchTerm);
      
      const matchesProgram = !activeProgram || (member.batches && member.batches.some(batch => 
        batch.program && batch.program.id === activeProgram
      ));
      
      const matchesBatch = !activeBatch || (member.batches && member.batches.some(batch => 
        batch.id === activeBatch
      ));

      if (activeTab === "programs") {
        return matchesSearch && matchesProgram;
      } else {
        return matchesSearch && matchesBatch;
      }
    });
  }, [members, searchTerm, activeProgram, activeBatch, activeTab]);

  const handleAddMember = async (newMember: any) => {
    try {
      const result = await dispatch(createMember(newMember)).unwrap();
      
      toast({
        title: "Member Added",
        description: `${newMember.name} has been successfully added.`,
      });
      
      setIsAddMemberOpen(false);
    } catch (error: any) {
      console.error('Error adding member:', error);
      toast({
        title: "Error Adding Member",
        description: formatBackendError(error),
        variant: "destructive"
      });
      throw error; // Re-throw to prevent form closure
    }
  };

  const handleUpdateMember = async (updatedMember: Partial<Member> & { batch_ids?: number[] }) => {
    try {
      const result = await dispatch(updateMember({
        id: updatedMember.id!,
        memberData: {
          name: updatedMember.name,
          email: updatedMember.email,
          mobile: updatedMember.mobile,
          status: updatedMember.status,
          batch_ids: updatedMember.batch_ids
        }
      })).unwrap();
      
      toast({
        title: "Member Updated",
        description: `Member has been successfully updated.`,
      });
    } catch (error: any) {
      console.error('Error updating member:', error);
      toast({
        title: "Error Updating Member",
        description: formatBackendError(error),
        variant: "destructive"
      });
      throw error; // Re-throw to prevent form closure
    }
  };

  const handleDeleteMember = async () => {
    if (!selectedMember) return;
    
    try {
      await dispatch(deleteMember(selectedMember.id)).unwrap();
      
      toast({
        title: "Member Deleted",
        description: "Member has been successfully deleted.",
      });
    } catch (error: any) {
      console.error('Error deleting member:', error);
      toast({
        title: "Error Deleting Member",
        description: formatBackendError(error),
        variant: "destructive"
      });
      throw error;
    }
  };

  const handleTabChange = (value: "programs" | "batches") => {
    setActiveTab(value);
    setActiveProgram(null);
    setActiveBatch(null);
    // Clear selected member when switching tabs
    dispatch(clearSelectedMember());
  };

  const handleSelectMember = (member: Member) => {
    dispatch(setSelectedMember(member));
  };

  // Clear member selection when changing program filter
  const handleProgramClick = (programId: number | null) => {
    setActiveProgram(programId);
    dispatch(clearSelectedMember());
  };

  // Clear member selection when changing batch filter  
  const handleBatchClick = (batchId: number | null) => {
    setActiveBatch(batchId);
    dispatch(clearSelectedMember());
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-wrap">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight animate-fade-in">
          Member Management
        </h1>
        <Button onClick={() => setIsAddMemberOpen(true)} className="flex items-center gap-2 whitespace-nowrap">
          <Plus size={16} />
          Add New Member
        </Button>
      </div>

      {/* Tabs section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 overflow-hidden">
        <Tabs value={activeTab} onValueChange={(value) => handleTabChange(value as "programs" | "batches")}>
          <div className="overflow-x-auto">
            <TabsList className="mb-4">
              <TabsTrigger value="programs">Programs</TabsTrigger>
              <TabsTrigger value="batches">Batches</TabsTrigger>
            </TabsList>
          </div>
          
          {/* Programs tab content */}
          <TabsContent value="programs">
            <h2 className="text-lg font-semibold mb-4">Program Segments</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto p-2">
              <ProgramSegmentCard 
                programName="All Programs" 
                memberCount={members.length}
                onClick={() => handleProgramClick(null)}
                isActive={activeProgram === null}
                colorIndex={0}
              />
              
              {programStats.filter(program => program.count > 0).map((program, index) => (
                <ProgramSegmentCard 
                  key={program.id}
                  programName={program.name} 
                  memberCount={program.count}
                  onClick={() => handleProgramClick(program.id)}
                  isActive={activeProgram === program.id}
                  colorIndex={index + 1}
                />
              ))}
              
              {programsLoading && programStats.length === 0 && (
                <div className="col-span-full text-center py-4">Loading programs...</div>
              )}
              
              {!programsLoading && programStats.filter(p => p.count > 0).length === 0 && (
                <div className="col-span-full text-center py-4 text-gray-500">
                  No programs with members found
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Batches tab content */}
          <TabsContent value="batches">
            <h2 className="text-lg font-semibold mb-4">Batch Segments</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <BatchSegmentCard 
                batchName="All Batches" 
                memberCount={members.length}
                onClick={() => handleBatchClick(null)}
                isActive={activeBatch === null}
                colorIndex={0}
              />
              
              {batchStats.filter(batch => batch.count > 0).map((batch, index) => (
                <BatchSegmentCard 
                  key={batch.id}
                  batchName={batch.name} 
                  memberCount={batch.count}
                  onClick={() => handleBatchClick(batch.id)}
                  isActive={activeBatch === batch.id}
                  colorIndex={index + 1}
                />
              ))}
              
              {batchesLoading && batchStats.length === 0 && (
                <div className="col-span-full text-center py-4">Loading batches...</div>
              )}
              
              {!batchesLoading && batchStats.filter(b => b.count > 0).length === 0 && (
                <div className="col-span-full text-center py-4 text-gray-500">
                  No batches with members found
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Members list and details section */}
      <div className={`grid grid-cols-1 ${isMobile ? '' : 'md:grid-cols-4'} gap-6`}>
        {/* Members list */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:col-span-1 overflow-hidden">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium truncate pr-2">
                {activeTab === "programs" 
                  ? (activeProgram ? `${programStats.find(p => p.id === activeProgram)?.name} Members` : 'All Members') 
                  : (activeBatch ? `${batchStats.find(b => b.id === activeBatch)?.name} Members` : 'All Members')}
              </h3>
              {(activeProgram || activeBatch) && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => activeTab === "programs" ? handleProgramClick(null) : handleBatchClick(null)}
                  className="h-8 w-8 flex-shrink-0"
                >
                  <X size={16} />
                </Button>
              )}
            </div>
            
                        <div className="relative w-full">
              <Input
                placeholder="Search members..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pr-10 min-w-0" // Added min-w-0
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setSearchTerm("")}
                  aria-label="Clear search"
                >
                  <X size={16} />
                </Button>
              )}
            </div>

            
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredMembers.map(member => (
                <div
                  key={member.id}
                  onClick={() => handleSelectMember(member)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedMember?.id === member.id
                      ? "bg-purple-100 border-l-4 border-purple-500"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <div className="font-medium truncate">{member.name || member.email}</div>
                  <div className="text-sm text-gray-500 truncate">{member.email}</div>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>
                      {member.batches ? 
                        `${new Set(member.batches.map(b => b.program?.id)).size} Program(s)` : 
                        "0 Programs"}
                    </span>
                    <span>{member.batches ? `${member.batches.length} Batch(es)` : "0 Batches"}</span>
                  </div>
                </div>
              ))}
              {filteredMembers.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  {activeTab === "programs" 
                    ? (activeProgram 
                      ? `No members found in this program matching your search.`
                      : "No members found matching your search."
                    )
                    : (activeBatch 
                      ? `No members found in this batch matching your search.`
                      : "No members found matching your search."
                    )
                  }
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Member details */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 md:col-span-3 animate-fade-in overflow-auto">
          {selectedMember ? (
            <MemberDetails 
              member={selectedMember} 
              onUpdateMember={handleUpdateMember} 
              onDeleteMember={handleDeleteMember}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <Users size={48} className="mb-4 opacity-50" />
              <p>Select a member to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* Add member dialog */}
      <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
        <AddMemberDialog 
          open={isAddMemberOpen}
          onOpenChange={setIsAddMemberOpen}
          onAddMember={handleAddMember}
        />
      </Dialog>
    </div>
  );
};

export default MemberManagement;
