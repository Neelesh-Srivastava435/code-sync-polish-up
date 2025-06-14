import React, { useState, useEffect, useMemo } from 'react';
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Member, BatchUI, ProgramUI } from '@/types/member.ts';
import api from '@/api/axios';
import {
  validateAlphanumeric,
  validateEmail,
  validateMobile
} from '@/utils/formValidation.ts';
import { handleApiError } from '@/utils/errorHandling.ts';
import { Loader2, X, Check, ChevronDown, AlertTriangle, BookOpen } from 'lucide-react';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Dialog as BatchSelectionDialog } from '@radix-ui/react-dialog';

interface EditMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: Member;
  onUpdateMember: (updatedMember: Partial<Member> & { batch_ids?: number[] }) => Promise<void>;
}

interface Validation {
  name?: string;
  email?: string;
  mobile?: string;
}

interface FormData {
  name: string;
  email: string;
  mobile: string;
  batch_ids: number[];
  status: string;
}

const CLEAR_PROGRAM_FILTER_VALUE = "_all_programs_";

const EditMemberDialog: React.FC<EditMemberDialogProps> = ({
  open,
  onOpenChange,
  member,
  onUpdateMember,
}) => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    mobile: '',
    batch_ids: [],
    status: 'active'
  });
  const [selectedProgramId, setSelectedProgramId] = useState<string>('');
  const [availableBatches, setAvailableBatches] = useState<BatchUI[]>([]);
  const [selectedBatches, setSelectedBatches] = useState<BatchUI[]>([]);
  const [tempSelectedBatches, setTempSelectedBatches] = useState<BatchUI[]>([]);
  const [validation, setValidation] = useState<Validation>({});
  const [programs, setPrograms] = useState<ProgramUI[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBatchDialogOpen, setIsBatchDialogOpen] = useState(false);
  const [batchSearchTerm, setBatchSearchTerm] = useState('');

  const { toast } = useToast();

  // This function resets all relevant states, including selectedProgramId
  const resetDialogState = () => {
    setFormData({
      name: '',
      email: '',
      mobile: '',
      batch_ids: [],
      status: 'active'
    });
    setSelectedProgramId(''); // This line ensures the program filter resets
    setAvailableBatches([]);
    setSelectedBatches([]);
    setTempSelectedBatches([]);
    setValidation({});
    setPrograms([]);
    setIsLoading(false);
    setIsSubmitting(false);
    setIsBatchDialogOpen(false);
    setBatchSearchTerm('');
  };

  useEffect(() => {
    if (member && open) {
      // Populate form with member data
      setFormData({
        name: member.name || '',
        email: member.email || '',
        mobile: member.mobile || '',
        batch_ids: member.batches ? member.batches.map(batch => batch.id) : [],
        status: member.status
      });

      const initialMemberBatches: BatchUI[] = member.batches
        ? member.batches.map(b => ({
            id: b.id,
            name: b.name,
            programId: b.program?.id || 0,
            programName: b.program?.name || '',
          }))
        : [];
      
      setSelectedBatches(initialMemberBatches);
      setTempSelectedBatches([...initialMemberBatches]);
      setValidation({});
      setBatchSearchTerm('');
      setIsBatchDialogOpen(false);
      // Note: selectedProgramId is not reset here when opening,
      // allowing the filter to persist if the dialog is quickly closed and reopened.
      // It is reset by resetDialogState when the dialog fully closes.
    } else if (!open) {
      // Reset all state when dialog is closed
      resetDialogState(); // This call includes setSelectedProgramId('')
    }
  }, [member, open]); // resetDialogState is stable, no need to add to deps


  useEffect(() => {
    if (open) {
      fetchPrograms();
    }
  }, [open]);

  useEffect(() => {
    if (open && programs.length > 0) {
      fetchBatches();
    }
  }, [selectedProgramId, open, programs.length]);


  const fetchPrograms = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/admin/programs');
      setPrograms(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch programs:', error);
      toast({ title: "Error Loading Programs", description: handleApiError(error, 'Failed to load programs'), variant: "destructive" });
      setPrograms([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBatches = async () => {
    setIsLoading(true);
    try {
      let response;
      if (selectedProgramId) {
        // This API call is for batches of a specific program.
        // It should already be optimized to return active batches.
        // If it's not returning program.name, the existing fallback will handle it.
        response = await api.get(`/admin/programs/${selectedProgramId}/batches`);
      } else {
        // Call the new optimized endpoint for fetching all active batches with minimal fields
        response = await api.get('/admin/batches/programmed-batches');
      }
      const apiBatches = response.data.data || [];

      // The backend now sends program_name directly for the new endpoint,
      // so mapping is simpler for that case.
      // The fallback logic handles the case where program_name is not directly available (e.g., from /admin/programs/{id}/batches).
      const formattedBatches: BatchUI[] = apiBatches.map((batch: any) => {
        let pName = batch.program_name || batch.program?.name; // Prioritize direct program_name from new API

        // Fallback to lookup in programs state if program name is still missing
        if ((!pName || String(pName).trim() === '') && batch.program_id && programs.length > 0) {
          const foundProgram = programs.find(p => p.id === batch.program_id);
          if (foundProgram) {
            pName = foundProgram.name;
          }
        }
        return {
          id: batch.id,
          name: batch.name,
          programId: batch.program_id, // from backend
          programName: pName || '', 
        };
      });
      setAvailableBatches(formattedBatches);
    } catch (error) {
      console.error('Failed to fetch batches:', error);
      toast({ title: "Error Loading Batches", description: handleApiError(error, 'Failed to load batches'), variant: "destructive" });
      setAvailableBatches([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    if (validation[field as keyof Validation]) {
      setValidation(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const toggleBatchSelectionInDialog = (batchToToggle: BatchUI) => {
    setTempSelectedBatches(prevSelected => {
      const isAlreadySelected = prevSelected.some(b => b.id === batchToToggle.id);
      if (isAlreadySelected) {
        return prevSelected.filter(b => b.id !== batchToToggle.id);
      } else {
        return [...prevSelected, batchToToggle];
      }
    });
  };

  const handleConfirmBatchSelection = () => {
    setSelectedBatches(tempSelectedBatches);
    setFormData(prevForm => ({
      ...prevForm,
      batch_ids: tempSelectedBatches.map(b => b.id)
    }));
    setIsBatchDialogOpen(false);
  };

  const handleOpenBatchDialog = () => {
    const currentSelectedWithUpToDateProgramNames = selectedBatches.map(sb => {
        let pName = sb.programName;
        if ((!pName || String(pName).trim() === '') && sb.programId && programs.length > 0) {
            const foundProgram = programs.find(p => p.id === sb.programId);
            if (foundProgram) {
                pName = foundProgram.name;
            }
        }
        return {...sb, programName: pName || ''};
    });
    setTempSelectedBatches([...currentSelectedWithUpToDateProgramNames]);
    setBatchSearchTerm('');
    setIsBatchDialogOpen(true);
  };

  const handleBatchRemoveFromBadges = (batchId: number) => {
    const newSelectedBatches = selectedBatches.filter(b => b.id !== batchId);
    setSelectedBatches(newSelectedBatches);
    setFormData(prev => ({
      ...prev,
      batch_ids: newSelectedBatches.map(b => b.id)
    }));
    setTempSelectedBatches(prevTemp => prevTemp.filter(b => b.id !== batchId));
  };

  const handleClearAllBatchesFromBadges = () => {
    setSelectedBatches([]);
    setFormData(prev => ({
      ...prev,
      batch_ids: []
    }));
    setTempSelectedBatches([]);
  };

  const handleProgramRemoveFromBadges = (programIdToRemove: number) => {
    const newSelectedBatches = selectedBatches.filter(
      batch => batch.programId !== programIdToRemove
    );
    setSelectedBatches(newSelectedBatches);
    setFormData(prev => ({
      ...prev,
      batch_ids: newSelectedBatches.map(b => b.id)
    }));
    setTempSelectedBatches(prevTemp =>
      prevTemp.filter(batch => batch.programId !== programIdToRemove)
    );
  };


  const handleProgramSelectChange = (value: string) => {
    if (value === CLEAR_PROGRAM_FILTER_VALUE) {
      setSelectedProgramId('');
    } else {
      setSelectedProgramId(value);
    }
  };

  const validateForm = (): boolean => {
    const errors: Validation = {};
    const nameError = validateAlphanumeric(formData.name, "Name");
    if (nameError) errors.name = nameError;
    const emailError = validateEmail(formData.email);
    if (emailError) errors.email = emailError;
    const mobileError = validateMobile(formData.mobile);
    if (mobileError) errors.mobile = mobileError;
    setValidation(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast({ title: "Validation Error", description: "Please fix the errors in the form.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const updatedMemberData: Partial<Member> & { batch_ids?: number[] } = {
        id: member.id,
        name: formData.name,
        email: formData.email,
        mobile: formData.mobile,
        batch_ids: formData.batch_ids,
        status: formData.status
      };
      await onUpdateMember(updatedMemberData);
      onOpenChange(false); // This will trigger the useEffect to call resetDialogState
    } catch (error) {
      // Parent handles error toast
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const filteredCommandBatches = availableBatches.filter(batch =>
    batch.name.toLowerCase().includes(batchSearchTerm.toLowerCase()) ||
    (batch.programName && batch.programName.toLowerCase().includes(batchSearchTerm.toLowerCase()))
  );

  const selectedProgramsToDisplay = useMemo(() => {
    const programsMap = new Map<number, { id: number; name: string }>();
    selectedBatches.forEach(batch => {
      if (batch.programId && batch.programId !== 0) {
        let pName = batch.programName;
        if ((!pName || String(pName).trim() === '') && programs.length > 0) {
          const programDetails = programs.find(prog => prog.id === batch.programId);
          if (programDetails) {
            pName = programDetails.name;
          }
        }
        if (pName && String(pName).trim() !== '') {
           if (!programsMap.has(batch.programId)) {
              programsMap.set(batch.programId, { id: batch.programId, name: pName });
          }
        }
      }
    });
    return Array.from(programsMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [selectedBatches, programs]);

  return (
    <DialogContent className="sm:max-w-[600px]">
      <DialogHeader>
        <DialogTitle>Edit Member</DialogTitle>
        <DialogDescription>Update member information and batch assignments.</DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-1 gap-4">
          {/* Name, Email, Mobile Inputs */}
          <div className="space-y-2">
            <Label htmlFor="edit-name">Member Name *</Label>
            <Input id="edit-name" value={formData.name} onChange={handleInputChange('name')} placeholder="John Doe" className={validation.name ? "border-red-500" : ""} disabled={isSubmitting} />
            {validation.name && <p className="text-xs text-red-500">{validation.name}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-email">Email *</Label>
            <Input id="edit-email" type="email" value={formData.email} onChange={handleInputChange('email')} placeholder="john@example.com" className={validation.email ? "border-red-500" : ""} disabled={isSubmitting} />
            {validation.email && <p className="text-xs text-red-500">{validation.email}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-mobile">Mobile Number *</Label>
            <Input id="edit-mobile" value={formData.mobile} onChange={handleInputChange('mobile')} placeholder="+1 (555) 123-4567" className={validation.mobile ? "border-red-500" : ""} disabled={isSubmitting} />
            {validation.mobile && <p className="text-xs text-red-500">{validation.mobile}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-status">Status *</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select status">
                  {formData.status && (
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-sm ${
                      formData.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : formData.status === 'inactive'
                        ? 'bg-yellow-100 text-yellow-800'
                        : formData.status === 'blacklisted'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {formData.status.charAt(0).toUpperCase() + formData.status.slice(1)}
                    </span>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">
                  <span className="inline-flex px-2 py-0.5 rounded-full text-sm bg-green-100 text-green-800">
                    Active
                  </span>
                </SelectItem>
                <SelectItem value="inactive">
                  <span className="inline-flex px-2 py-0.5 rounded-full text-sm bg-yellow-100 text-yellow-800">
                    Inactive
                  </span>
                </SelectItem>
                <SelectItem value="blacklisted">
                  <span className="inline-flex px-2 py-0.5 rounded-full text-sm bg-red-100 text-red-800">
                    Blacklisted
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Program Filter */}
          <div className="space-y-2">
            <Label htmlFor="edit-program">Filter Batches by Program</Label>
            <Select 
              value={selectedProgramId || CLEAR_PROGRAM_FILTER_VALUE}
              onValueChange={handleProgramSelectChange}
              disabled={isLoading || isSubmitting}
            >
              <SelectTrigger id="edit-program">
                <SelectValue placeholder="Select a program to filter batches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={CLEAR_PROGRAM_FILTER_VALUE}>All Programs (No Filter)</SelectItem>
                {programs.map((program: ProgramUI) => (
                  <SelectItem key={program.id} value={program.id.toString()}>
                    {program.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Selected Programs Display */}
          {selectedProgramsToDisplay.length > 0 && (
            <div className="space-y-1 mt-3">
              <Label className="text-xs text-gray-500">Programs of Selected Batches:</Label>
              <div className="flex flex-wrap gap-2 pt-1">
                {selectedProgramsToDisplay.map(program => (
                  <Badge 
                    key={program.id} 
                    variant="outline"
                    className="flex items-center gap-1 bg-purple-100 text-purple-700 border-purple-300 hover:bg-purple-200"
                  >
                    {program.name}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 p-0 ml-1 hover:bg-transparent text-purple-500 hover:text-destructive"
                      onClick={() => handleProgramRemoveFromBadges(program.id)}
                      aria-label={`Remove all batches from program ${program.name}`}
                      disabled={isSubmitting}
                    >
                      <X size={12} />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Batch Selection */}
          <div className="space-y-2 mt-3">
            <Label>Enroll in Batches</Label>
            {isLoading ? (
              <div className="flex items-center text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading batches...
              </div>
            ) : selectedProgramId && availableBatches.length === 0 && !isLoading ? (
              <div className="flex items-center p-3 text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-md">
                <AlertTriangle className="h-4 w-4 mr-2" />
                No batches exist for the selected program.
              </div>
            ) : (
              <>
                <Button 
                  onClick={handleOpenBatchDialog} 
                  variant="outline" 
                  className="w-full justify-start"
                  disabled={isSubmitting || (availableBatches.length === 0 && !selectedProgramId && programs.length > 0 && !isLoading) } 
                >
                  <BookOpen className="mr-2 h-4 w-4" />
                  {selectedBatches.length > 0 ? `${selectedBatches.length} batch(es) selected` : "Select batches"}
                  <ChevronDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
                </Button>

                <BatchSelectionDialog open={isBatchDialogOpen} onOpenChange={setIsBatchDialogOpen}>
                  <DialogContent className="max-w-lg sm:max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Select Batches</DialogTitle>
                      <DialogDescription>
                        Choose the batches to assign to this member.
                        {selectedProgramId && programs.find(p => p.id.toString() === selectedProgramId) && (
                            <span className="block text-xs text-muted-foreground mt-1">
                                Filtering by program: {programs.find(p => p.id.toString() === selectedProgramId)?.name}
                            </span>
                        )}
                      </DialogDescription>
                    </DialogHeader>
                    <Command>
                      <CommandInput
                        placeholder="Search batches..."
                        value={batchSearchTerm}
                        onValueChange={setBatchSearchTerm}
                        className="h-9"
                      />
                      <CommandList className="max-h-[calc(60vh-120px)] overflow-y-auto">
                        <CommandEmpty>
                          {isLoading ? "Loading..." : 
                           (availableBatches.length === 0 && !selectedProgramId && programs.length > 0
                            ? "No batches available. Select a program to see its batches, or clear the filter." 
                            : "No batches found."
                           )
                          }
                        </CommandEmpty>
                        <CommandGroup>
                          {filteredCommandBatches.map((batch) => (
                            <CommandItem
                              key={batch.id}
                              value={`${batch.name}-${batch.id}-${batch.programName || 'no-program'}`} 
                              onSelect={() => toggleBatchSelectionInDialog(batch)}
                              className="flex items-center justify-between p-2 cursor-pointer"
                            >
                              <div className="flex flex-col">
                                <span className="font-medium">{batch.name}</span>
                                {batch.programName && String(batch.programName).trim() !== '' && (
                                  <span className="text-xs text-muted-foreground">
                                    ({batch.programName})
                                  </span>
                                )}
                              </div>
                              {tempSelectedBatches.some((sb) => sb.id === batch.id) && (
                                <Check className="h-4 w-4 text-primary flex-shrink-0" />
                              )}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                    <DialogFooter className="mt-4">
                      <Button variant="outline" onClick={() => setIsBatchDialogOpen(false)} disabled={isSubmitting}>
                        Cancel
                      </Button>
                      <Button onClick={handleConfirmBatchSelection} disabled={isSubmitting}>Done</Button>
                    </DialogFooter>
                  </DialogContent>
                </BatchSelectionDialog>
              </>
            )}

            {selectedBatches.length > 0 && (
              <div className="space-y-1 mt-2">
                 <div className="flex justify-between items-center">
                    <Label className="text-xs text-gray-500">Assigned Batches:</Label>
                    <Button variant="ghost" size="sm" className="h-auto px-2 py-1 text-xs" onClick={handleClearAllBatchesFromBadges} disabled={isSubmitting}>Clear All</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedBatches.map(batch => {
                    let displayProgramName = batch.programName;
                    if ((!displayProgramName || String(displayProgramName).trim() === '') && batch.programId && batch.programId !== 0 && programs.length > 0) {
                      const programDetails = programs.find(p => p.id === batch.programId);
                      if (programDetails) {
                        displayProgramName = programDetails.name;
                      }
                    }
                    return (
                      <Badge key={batch.id} variant="secondary" className="flex items-center gap-1">
                        {batch.name}
                        {displayProgramName && String(displayProgramName).trim() !== '' && (
                          <span className="text-xs opacity-75">({displayProgramName})</span>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-4 w-4 p-0 ml-1 hover:bg-transparent text-muted-foreground hover:text-destructive" 
                          onClick={() => handleBatchRemoveFromBadges(batch.id)} 
                          aria-label={`Remove batch ${batch.name}`}
                          disabled={isSubmitting}
                        >
                          <X size={12} />
                        </Button>
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={isLoading || isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Update Member
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

export default EditMemberDialog;
