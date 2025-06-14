import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash, Edit } from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks/hooks";
import {
  fetchPrograms,
  addProgram,
  updateProgram,
  deleteProgram,
  Program as ProgramType,
} from "@/store/program/programSlice";
import AmenitiesComponent from "@/components/AmenitiesComponent";

const VenueConfigurations: React.FC = () => {
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const { programs, loading, error } = useAppSelector(
    (state) => state.programs
  );
  const [newProgram, setNewProgram] = useState<Omit<ProgramType, 'id'>>({ name: '', description: '' });
  const [editingProgramId, setEditingProgramId] = useState<number | null>(null);
  const [isProgramDialogOpen, setIsProgramDialogOpen] = useState(false);
  
  // Fetch programs on component mount
  useEffect(() => {
    dispatch(fetchPrograms());
  }, [dispatch]);

  // Program functions
  const handleAddProgram = async () => {
    if (!newProgram.name.trim()) {
      toast({
        title: "Missing Information",
        description: "Program name is required.",
        variant: "destructive"
      });
      return;
    }
    if (editingProgramId) {
      try {
        await dispatch(updateProgram({ ...newProgram, id: editingProgramId })).unwrap();
        toast({
          title: "Program Updated",
          description: `${newProgram.name} has been updated.`
        });
      } catch (err: any) {
        toast({
          title: "Error",
          description: err.message || "Failed to update program.",
          variant: "destructive",
        });
      }
    } else {
      try {
        await dispatch(addProgram(newProgram)).unwrap();
        toast({
          title: "Program Added",
          description: `${newProgram.name} has been added to programs.`
        });
      } catch (err: any) {
        toast({
          title: "Error",
          description: err.message || "Failed to add program.",
          variant: "destructive",
        });
      }
    }
    
    setNewProgram({ name: '', description: '' });
    setEditingProgramId(null);
    setIsProgramDialogOpen(false);
  };
  
  const handleEditProgram = (program: ProgramType) => {
    setNewProgram({ name: program.name, description: program.description });
    setEditingProgramId(program.id);
    setIsProgramDialogOpen(true);
  };
  
  const handleDeleteProgram = async (id: number) => {
    try {
      await dispatch(deleteProgram(id)).unwrap();
      toast({
        title: "Program Deleted",
        description: "The program has been removed."
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to delete program.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="space-y-6">
      <Tabs defaultValue="programs" className="w-full">
        <TabsList className="grid w-[400px] grid-cols-2">
          <TabsTrigger value="programs">Programs</TabsTrigger>
          <TabsTrigger value="amenities">Amenities</TabsTrigger>
        </TabsList>
        
        {/* Programs Tab */}
        <TabsContent value="programs" className="space-y-4 pt-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Program Management</h3>
            <div className="flex gap-2">
              <Dialog open={isProgramDialogOpen} onOpenChange={setIsProgramDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus size={16} />
                    Add Program
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingProgramId ? 'Edit Program' : 'Add New Program'}
                    </DialogTitle>
                    <DialogDescription>
                      {editingProgramId 
                        ? 'Update the program details below.' 
                        : 'Enter the details for the new program.'}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="programName" className="text-right">
                        Name
                      </Label>
                      <Input
                        id="programName"
                        className="col-span-3"
                        value={newProgram.name}
                        onChange={(e) => setNewProgram({...newProgram, name: e.target.value})}
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="programDescription" className="text-right">
                        Description
                      </Label>
                      <Input
                        id="programDescription"
                        className="col-span-3"
                        value={newProgram.description}
                        onChange={(e) => setNewProgram({...newProgram, description: e.target.value})}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleAddProgram}>
                      {editingProgramId ? 'Update Program' : 'Add Program'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          <div className="border rounded-md overflow-hidden">
            {loading ? (
              <p className="p-4 text-center text-gray-500">Loading programs...</p>
            ) : error ? (
              <p className="p-4 text-center text-red-500">Error: {error}</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Program Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {programs.map((program) => (
                    <TableRow key={program.id}>
                      <TableCell className="font-medium">{program.name}</TableCell>
                      <TableCell>{program.description}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleEditProgram(program)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleDeleteProgram(program.id)}
                          >
                            <Trash className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {programs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-4 text-gray-500">
                        No programs added yet. Click "Add Program" to create one.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>
        
        {/* Amenities Tab */}
        <TabsContent value="amenities" className="space-y-4 pt-4">
          <AmenitiesComponent 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VenueConfigurations;
