import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { Calendar, Clock, Users, Building, MapPin, Check, Search, UserPlus, X, ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { useForm } from "react-hook-form";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { format } from 'date-fns';
import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks/hooks';
import { 
  fetchBatches,
  fetchVenues, 
  fetchVenueSpots, 
  fetchPartners, 
  fetchPrograms, 
  addBatch,
  Batch,
  DropdownItem
} from '@/store/batch/batchSlice';

interface Partner {
  id: number;
  name: string;
  specialization: string;
}

interface VenueSpot {
  id: number;
  name: string;
  area: string;
  capacity: string;
  amenities: number[];
  operativeDays: number[];
  startTime: string;
  endTime: string;
}

interface Venue {
  id: number;
  name: string;
  spots?: VenueSpot[];
}

interface ProrationSettings {
  enabled: boolean;
  prorationMethod: 'daily' | 'weekly' | 'none';
  billingCycleDay: number;
}

interface AddBatchFormProps {
  onClose?: () => void;
  onBatchAdded?: () => void;
  onSubmit?: (batch: any) => void;
  showSpotSelection?: boolean;
}

interface BatchFormData extends Omit<Batch, 'id' | 'partners' | 'venue' | 'spot' | 'program'> {
  id?: string;
  programId: number | null;
  venueId: number | null;
  venueSpotId: number | null;
}

const AddBatchForm: React.FC<AddBatchFormProps> = ({ onClose, onBatchAdded, showSpotSelection = true, onSubmit }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const form = useForm();
  const dispatch = useAppDispatch();
  
    const { 
    programs, 
    venues, 
    partners: partnersFromStore, // Use partners from Redux store
    venueSpots // Use venueSpots from Redux store
  } = useAppSelector((state) => state.batch);

  // Local state for available spots, derived from Redux store
  const [currentVenueSpots, setCurrentVenueSpots] = useState<DropdownItem[]>([]);

  const [batchDetails, setBatchDetails] = useState<BatchFormData>({
    name: '',
    programId: null,
    type: 'fixed',
    venueId: null,
    venueSpotId: null,
    capacity: 0,
    partnerIds: [],
    description: '',
    startDate: '',
    endDate: '',
    sessionStartTime: '',
    sessionEndTime: '',
    noOfSessions: 0,
    schedulePattern: 'MWF',
    amount: 0,
    currency: 'INR',
    discountAvailable: false,
    discountPercentage: 0,
    status: 'active',
    progress: 0,
    selectedSessionDates: [], // Adding the missing property
  });

  useEffect(() => {
    if (programs.length === 0) {
      dispatch(fetchPrograms());
    }
    if (venues.length === 0) {
      dispatch(fetchVenues());
    }
    if (partnersFromStore.length === 0) {
      dispatch(fetchPartners());
    }
  }, [dispatch, programs.length, venues.length, partnersFromStore.length]); 

  useEffect(() => {
    if (batchDetails.venueId > 0) {
      dispatch(fetchVenueSpots(batchDetails.venueId));
    } else {
      setCurrentVenueSpots([]); 
    }
  }, [batchDetails.venueId, dispatch]);

  useEffect(() => {
    if (batchDetails.venueId > 0) {
      setCurrentVenueSpots(venueSpots);
    } else {
      setCurrentVenueSpots([]);
    }
  }, [venueSpots, batchDetails.venueId]);

  const [searchTerm, setSearchTerm] = useState('');
  const [availablePartners, setAvailablePartners] = useState<Partner[]>([]);
  const [isPartnerPopoverOpen, setIsPartnerPopoverOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  useEffect(() => {
    if (batchDetails.venueId > 0) {
      dispatch(fetchVenueSpots(batchDetails.venueId));
    }
  }, [batchDetails.venueId, dispatch]);

  const filteredPartners = partnersFromStore.filter(partner => 
    partner.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (partner.specialization && partner.specialization.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setBatchDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = parseInt(value);
    
    // Add validation for capacity field
    if (name === 'capacity') {
      // Using a safe maximum value that MySQL INT can handle
      const MAX_CAPACITY = 2147483647; // Maximum value for INT in MySQL
      
      if (numValue > MAX_CAPACITY) {
        toast({
          title: "Invalid Capacity",
          description: "Capacity value is too large. Please enter a smaller number.",
          variant: "destructive"
        });
        return;
      }
    }
    
    setBatchDetails(prev => ({ 
      ...prev, 
      [name]: isNaN(numValue) 
        ? 0 
        : (name === 'noOfSessions' || name === 'capacity' || name === 'amount' || name === 'discountPercentage') 
          ? Math.max(0, numValue) // Ensure non-negative for these specific fields
          : numValue 
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    if (name === "venueId") {
      const venueId = value ? parseInt(value) : null;
      setBatchDetails(prev => ({ 
        ...prev, 
        venueId,
        venueSpotId: null // Reset spot when venue changes
      }));
      
      if (venueId) {
        dispatch(fetchVenueSpots(venueId));
      } else {
        setCurrentVenueSpots([]);
      }
    } else if (name === "programId") {
      setBatchDetails(prev => ({ ...prev, programId: value ? parseInt(value) : null }));
    } else {
      setBatchDetails(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleBatchModeChange = (value: string) => {
    setBatchDetails(prev => ({ 
      ...prev, 
      type: value,
    }));
  };

  const handleSpotChange = (value: string) => {
    const spotId = parseInt(value);
    setBatchDetails(prev => ({ ...prev, venueSpotId: spotId }));
  };

  const handleDateChange = (name: string, date: Date | null) => {
    if (name === "startDate") {
      setStartDate(date);
      if (date) {
        setBatchDetails(prev => ({ ...prev, startDate: format(date, 'yyyy-MM-dd') }));
      }
    } else if (name === "endDate") {
      setEndDate(date);
      if (date) {
        setBatchDetails(prev => ({ ...prev, endDate: format(date, 'yyyy-MM-dd') }));
      }
    }
  };

  const handleFeeConfigChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    if (type === 'checkbox') {
      setBatchDetails(prev => ({
        ...prev,
      }));
    } else if (name === "amount") {
      const amount = parseInt(value);
      setBatchDetails(prev => ({
        ...prev,
        amount: isNaN(amount) ? 0 : amount,
      }));
    } else {
      setBatchDetails(prev => ({
        ...prev,
      }));
    }
  };

  const handleFeeTypeChange = (value: string) => {
    setBatchDetails(prev => ({
      ...prev,
    }));
  };

  const handlePaymentModelChange = (value: string) => {
    setBatchDetails(prev => ({
      ...prev,
    }));
  };

  const handleFeeDurationChange = (value: string) => {
    setBatchDetails(prev => ({
      ...prev,
    }));
  };

  const handleDiscountChange = (checked: boolean) => {
    setBatchDetails(prev => ({
      ...prev,
      discountAvailable: checked,
    }));
  };

  const handleDiscountPercentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    const percentage = isNaN(value) ? 0 : Math.min(value, 100);
    
    setBatchDetails(prev => ({
      ...prev,
      discountPercentage: percentage,
    }));
  };

  const handleProrationChange = (enabled: boolean) => {
    setBatchDetails(prev => ({
      ...prev,
    }));
  };

  const handleProrationMethodChange = (value: string) => {
    setBatchDetails(prev => ({
      ...prev,
    }));
  };

  const handleBillingCycleDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const day = parseInt(e.target.value);
    const validDay = Math.min(Math.max(isNaN(day) ? 1 : day, 1), 28);
    setBatchDetails(prev => ({
      ...prev,
    }));
  };

  const calculateProratedAmount = (joinDate: Date, amount: number): number => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    const daysRemaining = daysInMonth - joinDate.getDate() + 1;
    
    return Math.round((amount / daysInMonth) * daysRemaining);
  };

  const exampleJoinDate = new Date(2025, 3, 24);
  const daysInExampleMonth = new Date(2025, 3 + 1, 0).getDate();

  const togglePartnerSelection = (partnerId: number) => {
    console.log("Toggling partner selection for ID:", partnerId);
    
    setBatchDetails(prevDetails => {
      const isSelected = prevDetails.partnerIds.includes(partnerId);
      
      if (isSelected) {
        return {
          ...prevDetails,
          partnerIds: prevDetails.partnerIds.filter(id => id !== partnerId)
        };
      } else {
        return {
          ...prevDetails,
          partnerIds: [...prevDetails.partnerIds, partnerId]
        };
      }
    });
  };

  const handleRemovePartner = (partnerId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("Removing partner with ID:", partnerId);
    setBatchDetails(prev => ({
      ...prev,
      partnerIds: prev.partnerIds.filter(id => id !== partnerId)
    }));
  };

  const handleClearAllPartners = () => {
    console.log("Clearing all partners");
    setBatchDetails(prev => ({
      ...prev,
      partnerIds: []
    }));
  };

  const handleSubmit = async () => {
    let missingFields = [];
    if (!batchDetails.name) {
      missingFields.push("Batch Name");
    }
    if (!batchDetails.programId) {
      missingFields.push("Program");
    }

    // Add capacity validation
    const MAX_CAPACITY = 2147483647; // Maximum value for INT in MySQL
    if (batchDetails.capacity > MAX_CAPACITY) {
      toast({
        title: "Invalid Capacity",
        description: "Capacity value is too large. Please enter a smaller number.",
        variant: "destructive"
      });
      return;
    }

    if (missingFields.length > 0) {
      toast({
        title: "Missing Information",
        description: `Please fill in the following required fields: ${missingFields.join(", ")}.`,
        variant: "destructive"
      });
      return;
    }

    // Validate session times
    if (batchDetails.sessionStartTime && batchDetails.sessionEndTime && batchDetails.sessionStartTime >= batchDetails.sessionEndTime) {
      toast({
        title: "Invalid Session Times",
        description: "Session Start Time must be earlier than Session End Time.",
        variant: "destructive"
      });
      return;
    }

    try {
      if (onSubmit) {
        onSubmit(batchDetails);
      } else {
        const submitData: Omit<Batch, 'id'> = {
          ...batchDetails,
          partners: [],
          venue: { id: batchDetails.venueId || 0, venue_name: '' },
          spot: { id: batchDetails.venueSpotId || 0, spot_name: '' },
          program: { id: batchDetails.programId || 0, name: '' },
          programId: batchDetails.programId || 0,
          venueId: batchDetails.venueId || 0,
          venueSpotId: batchDetails.venueSpotId || 0
        };
        await dispatch(addBatch(submitData)).unwrap();
        await dispatch(fetchBatches()); 
        
        toast({
          title: "Batch Created",
          description: `${batchDetails.name} has been created successfully.`,
        });
    
        if (onBatchAdded) {
          onBatchAdded();
        } else if (onClose) {
          onClose();
        } else {
          navigate('/batches');
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create batch. Please try again.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    console.log("Current partners selection:", batchDetails.partnerIds);
  }, [batchDetails.partnerIds]);

  const getFormattedSpotName = (spot: any) => {
    return `${spot.name} (Capacity: ${spot.capacity})`;
  };

  const handleSchedulePatternChange = (value: string) => {
    setBatchDetails(prev => ({
      ...prev,
      schedulePattern: value
    }));
  };

  const getPartnerNameById = (id: number) => {
    const partner = partnersFromStore.find(p => p.id === id);
    return partner ? partner.name : `Partner #${id}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center p-6 border-b">
        <h1 className="text-3xl font-bold tracking-tight">
          Add New Batch
        </h1>
      </div>
      <div className="px-6">
        <p className="text-muted-foreground">
          Create a new batch for your program
        </p>

        <Card className="w-full mt-4">
          <CardContent className="space-y-4 pt-6">
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Batch Details</TabsTrigger>
                <TabsTrigger value="schedule">Schedule</TabsTrigger>
                <TabsTrigger value="fee">Fee Configuration</TabsTrigger>
              </TabsList>
              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Batch Name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={batchDetails.name}
                      onChange={handleInputChange}
                      placeholder="Enter batch name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="programId">Program</Label>
                    <Select
                      value={batchDetails.programId?.toString() || ""}
                      onValueChange={(value) => handleSelectChange("programId", value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a program" />
                      </SelectTrigger>
                      <SelectContent>
                        {programs.map(program => (
                          <SelectItem key={program.id} value={program.id.toString()}>
                            {program.name}
                          </SelectItem>
                        ))}
                        {programs.length === 0 && (
                          <SelectItem value="0" disabled>No programs available</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Batch Type</Label>
                  <RadioGroup 
                    value={batchDetails.type} 
                    onValueChange={handleBatchModeChange}
                    className="flex space-x-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="fixed" id="fixed" />
                      <Label htmlFor="fixed" className="cursor-pointer">Fixed</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="recurring" id="recurring" />
                      <Label htmlFor="recurring" className="cursor-pointer">Recurring</Label>
                    </div>
                  </RadioGroup>
                  <p className="text-sm text-muted-foreground">
                    {batchDetails.type === "fixed" 
                      ? "Fixed batches are for limited duration classes (e.g., summer courses, workshops)" 
                      : "Recurring batches continue until explicitly paused or ended (e.g., regular monthly classes)"}
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="venueId">Venue</Label>
                      <Select
                        value={batchDetails.venueId?.toString() || ""}
                        onValueChange={(value) => handleSelectChange("venueId", value)}
                      >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a venue" />
                      </SelectTrigger>
                      <SelectContent>
                        {venues.map(venue => (
                          <SelectItem key={venue.id} value={venue.id.toString()}>
                            {venue.name}
                          </SelectItem>
                        ))}
                        {venues.length === 0 && (
                          <SelectItem value="0" disabled>No venues available</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {batchDetails.venueId > 0 && showSpotSelection && (
                    <div className="space-y-2">
                      <Label htmlFor="venueSpotId">Spot</Label>
                      <Select 
                        onValueChange={handleSpotChange}
                        value={batchDetails.venueSpotId > 0 ? batchDetails.venueSpotId.toString() : undefined}
                        disabled={venueSpots.length === 0}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={
                            venueSpots.length === 0 
                              ? "No spots available for this venue" 
                              : "Select a spot"
                          } />
                        </SelectTrigger>
                        <SelectContent>
                          {venueSpots.map(spot => (
                            <SelectItem key={spot.id} value={spot.id.toString()}>
                              {spot.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {venueSpots.length === 0 && batchDetails.venueId > 0 && (
                        <p className="text-xs text-gray-500 mt-1">This venue has no configured spots</p>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="capacity">Capacity</Label>
                    <Input
                      type="number"
                      id="capacity"
                      name="capacity"
                      value={batchDetails.capacity}
                      onChange={handleNumberInputChange}
                      placeholder="Enter capacity"
                      min="0"
                      max="2147483647"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="partners">Partners</Label>
                    <Popover open={isPartnerPopoverOpen} onOpenChange={setIsPartnerPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button 
                          variant="outline" 
                          role="combobox" 
                          className="w-full justify-between"
                        >
                          <div className="flex items-center">
                            <Users className="mr-2 h-4 w-4" />
                            {batchDetails.partnerIds.length === 0 
                              ? "Select partners" 
                              : `${batchDetails.partnerIds.length} partner${batchDetails.partnerIds.length > 1 ? 's' : ''} selected`}
                          </div>
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent 
                        className="w-[300px] p-0" 
                        align="start"
                        sideOffset={8}
                      >
                        <Command key={filteredPartners.length > 0 ? "command-has-items" : "command-no-items"}>
                          <CommandInput 
                            placeholder="Search partners..." 
                            value={searchTerm}
                            autoFocus
                            onValueChange={setSearchTerm}
                            className="h-9"
                          />
                          <CommandList>
                            <CommandEmpty>No partners found</CommandEmpty>
                            <CommandGroup className="max-h-[200px] overflow-y-auto">
                              {filteredPartners.map(partner => (
                                <CommandItem
                                  key={partner.id}
                                  onSelect={() => {
                                    togglePartnerSelection(partner.id);
                                    console.log(`Partner selected: ${partner.name} (${partner.id})`);
                                  }}
                                  className="flex items-center justify-between p-2 cursor-pointer"
                                >
                                  <div className="flex flex-col">
                                    <div className="font-medium">{partner.name}</div>
                                    <div className="text-xs text-gray-500">{partner.specialization}</div>
                                  </div>
                                  {batchDetails.partnerIds.includes(partner.id) && (
                                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                                  )}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                
                {batchDetails.partnerIds.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label>Selected Partners</Label>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 px-2 text-xs"
                        onClick={handleClearAllPartners}
                      >
                        Clear All
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {batchDetails.partnerIds.map(partnerId => (
                        <div 
                          key={partnerId} 
                          className="flex items-center bg-primary/10 text-primary rounded-full pl-3 pr-1 py-1"
                        >
                          <span className="text-sm">{getPartnerNameById(partnerId)}</span>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-5 w-5 p-0 ml-1 rounded-full hover:bg-primary/20"
                            onClick={(e) => handleRemovePartner(partnerId, e)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={batchDetails.status}
                    onValueChange={(value) => handleSelectChange("status", value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={batchDetails.description}
                    onChange={handleInputChange}
                    placeholder="Enter batch description"
                  />
                </div>

                <div className="pt-4">
                  <Button onClick={handleSubmit} className="w-full">
                    Create Batch
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="schedule" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <DatePicker
                      id="startDate"
                      onSelect={(date) => handleDateChange("startDate", date || null)}
                      selected={startDate}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <DatePicker
                      id="endDate"
                      onSelect={(date) => handleDateChange("endDate", date || null)}
                      selected={endDate}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sessionStartTime">Session Start Time</Label>
                    <Input
                      type="time"
                      id="sessionStartTime"
                      name="sessionStartTime"
                      value={batchDetails.sessionStartTime}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sessionEndTime">Session End Time</Label>
                    <Input
                      type="time"
                      id="sessionEndTime"
                      name="sessionEndTime"
                      value={batchDetails.sessionEndTime}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="noOfSessions">Number of Sessions</Label>
                  <Input
                    type="number"
                    id="noOfSessions"
                    name="noOfSessions"
                    min="0"
                    value={batchDetails.noOfSessions}
                    onChange={handleNumberInputChange}
                    placeholder="Enter number of sessions"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="schedulePattern">Schedule Pattern</Label>
                  <RadioGroup 
                    value={batchDetails.schedulePattern}
                    onValueChange={handleSchedulePatternChange}
                    className="grid grid-cols-2 gap-4"
                  >
                    <div className="flex items-center space-x-2 border rounded-md p-3">
                      <RadioGroupItem value="MWF" id="MWF" />
                      <Label htmlFor="MWF" className="cursor-pointer">Monday-Wednesday-Friday</Label>
                    </div>
                    <div className="flex items-center space-x-2 border rounded-md p-3">
                      <RadioGroupItem value="TTS" id="TTS" />
                      <Label htmlFor="TTS" className="cursor-pointer">Tuesday-Thursday-Saturday</Label>
                    </div>
                    <div className="flex items-center space-x-2 border rounded-md p-3">
                      <RadioGroupItem value="weekend" id="weekend" />
                      <Label htmlFor="weekend" className="cursor-pointer">Weekend Only</Label>
                    </div>
                    <div className="flex items-center space-x-2 border rounded-md p-3">
                      <RadioGroupItem value="manual" id="manual" />
                      <Label htmlFor="manual" className="cursor-pointer">Manual Selection</Label>
                    </div>
                  </RadioGroup>
                </div>
                {batchDetails.schedulePattern === "manual" && (
                  <div className="bg-gray-50 p-4 rounded-md border">
                    <p className="text-sm text-muted-foreground mb-2">
                      After creating the batch, you can customize the session schedule in the Session Routine tab.
                    </p>
                  </div>
                )}

                <div className="pt-4">
                  <Button onClick={handleSubmit} className="w-full">
                    Create Batch
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="fee" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount</Label>
                    <Input
                      type="number"
                      id="amount"
                      name="amount"
                      value={batchDetails.amount}
                      onChange={handleFeeConfigChange}
                      placeholder="Enter amount"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select 
                      value={batchDetails.currency}
                      onValueChange={(value) => setBatchDetails(prev => ({
                        ...prev,
                        currency: value,
                      }))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INR">₹ (INR)</SelectItem>
                        <SelectItem value="USD">$ (USD)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="hasDiscount"
                      checked={batchDetails.discountAvailable}
                      onCheckedChange={handleDiscountChange}
                    />
                    <Label htmlFor="hasDiscount">Apply Discount</Label>
                  </div>
                  
                  {batchDetails.discountAvailable && (
                    <div className="pl-6 pt-2">
                      <div className="space-y-2">
                        <Label htmlFor="discountPercentage">Discount Percentage</Label>
                        <div className="flex items-center">
                          <Input
                            type="number"
                            id="discountPercentage"
                            name="discountPercentage"
                            value={batchDetails.discountPercentage}
                            onChange={handleDiscountPercentChange}
                            min="0"
                            max="100"
                            className="w-24"
                          />
                          <span className="ml-2">%</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4">
                  <Button onClick={handleSubmit} className="w-full">
                    Create Batch
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddBatchForm;