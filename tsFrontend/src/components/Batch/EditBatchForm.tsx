import React, { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar as UICalendar } from "@/components/ui/calendar";
import { format, parseISO, isSameDay } from "date-fns";
import { CalendarIcon, X, Info, ChevronDown, Users, Check } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Separator } from "../ui/separator";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import { Switch } from "../ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks/hooks";
import {
  fetchPrograms,
  fetchVenues,
  fetchPartners,
  fetchVenueSpots,
  Batch,
  DropdownItem,
  clearVenueSpots,
} from "@/store/batch/batchSlice";

type BatchType = "fixed" | "recurring";
type SchedulePattern = "MWF" | "TTS" | "weekend" | "manual";
type Currency = "INR" | "USD";
type BatchStatus = "active" | "completed" | "inactive";

interface BatchFormData extends Omit<Batch, 'id'> {
  id?: string;
  selectedSessionDates: string[];
}

interface BatchFormValues {
  name: string;
  programId: number;
  type: BatchType;
  venueId: number;
  venueSpotId?: number;
  capacity: number;
  partnerIds: number[];
  description?: string;
  startDate: string;
  endDate: string;
  sessionStartTime: string;
  sessionEndTime: string;
  noOfSessions: number;
  schedulePattern: SchedulePattern;
  amount: number;
  currency: Currency;
  discountAvailable: boolean;
  discountPercentage: number;
  status: BatchStatus;
  progress: number;
  selectedSessionDates: string[];
}

// Schema definition
const formSchema = z.object({
  name: z.string().min(1, "Batch name is required"),
  programId: z.number({
    required_error: "Program is required",
  }),
  type: z.enum(["fixed", "recurring"]),
  venueId: z.number().optional(),
  venueSpotId: z.number().optional(),
  capacity: z.number().optional(),
  partnerIds: z.array(z.number()),
  description: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sessionStartTime: z.string().optional(),
  sessionEndTime: z.string().optional(),
  noOfSessions: z.number().optional(),
  schedulePattern: z.enum(["MWF", "TTS", "weekend", "manual"]),
  amount: z.number().min(0, "Amount must be non-negative"),
  currency: z.enum(["INR", "USD"]),
  discountAvailable: z.boolean(),
  discountPercentage: z.number().min(0).max(100),
  status: z.enum(["active", "completed", "inactive"]),
  progress: z.number().min(0).max(100),
  selectedSessionDates: z.array(z.string()).optional()
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return new Date(data.endDate) >= new Date(data.startDate);
    }
    return true;
  },
  {
    message: "End date cannot be before start date.",
    path: ["endDate"],
  }
);

interface EditBatchFormProps {
  batch: BatchFormData;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: BatchFormData) => void;
}

const EditBatchForm: React.FC<EditBatchFormProps> = ({
  batch,
  isOpen,
  onClose,
  onSubmit: onFormSubmit,
}) => {
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const {
    programs,
    venues,
    partners,
    venueSpots, // These are all spots fetched for various venues, stored in Redux
    loading: dataLoading, // General loading state for the batch slice
    spotsLoading, // General loading state for the batch slice
    spotsError, // General loading state for the batch slice
  } = useAppSelector((state) => state.batch);

  // In EditBatchForm.tsx, near the top with other useState hooks:
  const [startDate, setStartDateState] = useState<Date | undefined>();
  const [endDate, setEndDateState] = useState<Date | undefined>();
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [targetNumSessions, setTargetNumSessions] = useState<number>(12);
  const [availableSpots, setAvailableSpots] = useState<DropdownItem[]>([]); // Local state for spots of the currently selected venue
  const [extendEndDate, setExtendEndDate] = useState(false);
  const [isPartnerPopoverOpen, setIsPartnerPopoverOpen] = useState(false);
  const [partnerSearchTerm, setPartnerSearchTerm] = useState("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    if (programs.length === 0) {
      dispatch(fetchPrograms());
    }
    if (venues.length === 0) {
      dispatch(fetchVenues());
    }
    if (partners.length === 0) {
      dispatch(fetchPartners());
    }
  }, [dispatch, programs.length, venues.length, partners.length]);

  const watchedVenueId = form.watch("venueId");

  useEffect(() => {
    if (batch && isOpen) {
      console.log('Batch:', batch);
      
      const currentPartnerIds = Array.isArray(batch.partners) 
        ? batch.partners.map((p: { id: number }) => p.id) 
        : [];
      const initialStartDate = batch.startDate ? parseISO(batch.startDate) : undefined;
      const initialEndDate = batch.endDate ? parseISO(batch.endDate) : undefined;
      setStartDateState(initialStartDate);
      setEndDateState(initialEndDate);

      // Handle selected dates for manual schedule pattern
      if (batch.schedulePattern === 'manual' && Array.isArray(batch.selectedSessionDates) && batch.selectedSessionDates.length > 0) {
        console.log('Selected session dates:', batch.selectedSessionDates); // Debug log
        const parsedDates = batch.selectedSessionDates.map(dateStr => new Date(dateStr));
        console.log('Parsed dates:', parsedDates); // Debug log
        setSelectedDates(parsedDates);
        setTargetNumSessions(batch.noOfSessions || 0); // Set target based on batch's noOfSessions
      } else {
        setSelectedDates([]);
      }

      form.reset({
        name: batch.name || "",
        programId: batch.programId || 0,
        type: (batch.type as BatchType) || "fixed",
        venueId: batch.venueId || 0,
        venueSpotId: batch.venueSpotId,
        partnerIds: currentPartnerIds,
        capacity: batch.capacity || 0,
        description: batch.description || "",
        startDate: batch.startDate || "",
        endDate: batch.endDate || "",
        sessionStartTime: batch.sessionStartTime || "09:00",
        sessionEndTime: batch.sessionEndTime || "10:00",
        noOfSessions: batch.noOfSessions || 0,
        schedulePattern: (batch.schedulePattern as SchedulePattern) || "MWF",
        amount: batch.amount || 0,
        currency: (batch.currency as Currency) || "INR",
        discountAvailable: batch.discountAvailable || false,
        discountPercentage: batch.discountPercentage || 0,
        status: (batch.status as BatchStatus) || "active",
        progress: batch.progress || 0,
        selectedSessionDates: batch.selectedSessionDates || []
      });      

      if (batch.venueId) {
        dispatch(fetchVenueSpots(batch.venueId));
      } else {
        dispatch(clearVenueSpots());
      }
    } else {
      form.reset();
      dispatch(clearVenueSpots());
      setStartDateState(undefined);
      setEndDateState(undefined);
      setSelectedDates([]);
    }    
  }, [batch, isOpen, form, dispatch]);

  useEffect(() => {
    // Only run if watchedVenueId is a valid number and not the initial load handled by the above effect
    // This check avoids re-fetching if batch.venueId was already set.
    // However, if the user *changes* the venueId dropdown, this should fire.
    if (
      watchedVenueId &&
      typeof watchedVenueId === "number" &&
      watchedVenueId > 0
    ) {
      // Check if this venueId is different from the one potentially loaded from the 'batch' prop initially
      // to avoid redundant fetches if the component re-renders but watchedVenueId hasn't actually changed from user input.
      // A more robust way is to ensure fetchVenueSpots is only called when the *user* changes the venue.
      // For simplicity here, we fetch if watchedVenueId is valid.
      dispatch(fetchVenueSpots(watchedVenueId));
      form.setValue("venueSpotId", undefined, { shouldValidate: true }); // Reset spot selection
    } else if (
      watchedVenueId === undefined ||
      watchedVenueId === null ||
      watchedVenueId <= 0
    ) {
      // If venue is deselected or invalid
      dispatch(clearVenueSpots());
      form.setValue("venueSpotId", undefined, { shouldValidate: true });
    }
  }, [watchedVenueId, dispatch, form]);

  useEffect(() => {
    if (!spotsLoading) {
      setAvailableSpots(venueSpots || []);
    }
  }, [venueSpots, spotsLoading]);

  const onSubmit = (data: BatchFormValues) => {
    console.log(data);
    // ... your submit logic
  };

  const getFormattedSpotName = (spot: DropdownItem) => {
    return spot.name; // Directly use the name
  };

  const sessionSchedule = form.watch("schedulePattern");
  const showManualCalendar = sessionSchedule === "manual";
  const noOfSessionsFromForm = form.watch("noOfSessions"); // Watch the form field for "Number of Sessions"

  useEffect(() => {
    if (sessionSchedule === "manual") {
      // If manual, targetNumSessions is driven by the form input
      setTargetNumSessions(noOfSessionsFromForm || 0); 
    } else {
      setTargetNumSessions(batch?.noOfSessions || 0);
    }
  }, [noOfSessionsFromForm, sessionSchedule, batch?.noOfSessions]);

  const handleDateSelect = (dates: Date[] | undefined) => {
    if (!dates) {
      setSelectedDates([]);
      form.setValue("selectedSessionDates", [], { shouldValidate: true });
      return;
    }

    
    if (
      sessionSchedule === "manual" &&
      dates.length > selectedDates.length && // Check if a date was added
      dates.length > targetNumSessions      // Check if the new count exceeds the limit
    ) {
      toast({
        title: "Session limit reached",
        description: `You can only select up to ${targetNumSessions} sessions.`,
        variant: "destructive"
      });
      return;
    }

    // Sort dates chronologically
    const sortedDates = [...dates].sort((a, b) => a.getTime() - b.getTime());
    setSelectedDates(sortedDates);
    
    // Update form values
    const formattedDates = sortedDates.map(date => format(date, "yyyy-MM-dd"));
    form.setValue("selectedSessionDates", formattedDates, { shouldValidate: true });
  };

  const removeSelectedDate = (dateToRemove: Date) => {
    const newSelectedDates = selectedDates.filter(
      (date) => !isSameDay(date, dateToRemove)
    );
    setSelectedDates(newSelectedDates);
  };

  const getPartnerNameById = (id: number) => {
    const partner = partners.find((p) => p.id === id); // 'partners' comes from Redux store
    return partner ? partner.name : `Partner #${id}`;
  };


  const filteredPartners = partners.filter(
    (partner) =>
      partner.name.toLowerCase().includes(partnerSearchTerm.toLowerCase()) ||
      (partner.specialization &&
        partner.specialization
          .toLowerCase()
          .includes(partnerSearchTerm.toLowerCase()))
  );

  const togglePartnerSelection = (partnerId: number) => {
    const currentPartnerIds = form.getValues("partnerIds") || [];
    const newPartnerIds = currentPartnerIds.includes(partnerId)
      ? currentPartnerIds.filter((id) => id !== partnerId)
      : [...currentPartnerIds, partnerId];
    form.setValue("partnerIds", newPartnerIds, { shouldValidate: true });
  };

  const handleClearAllPartners = () => {
    form.setValue("partnerIds", [], { shouldValidate: true });
  };

  const processSubmit = (values: z.infer<typeof formSchema>) => {
    // Add capacity validation
    const MAX_CAPACITY = 2147483647; // Maximum value for INT in MySQL
    if (values.capacity > MAX_CAPACITY) {
      toast({
        title: "Invalid Capacity",
        description: "Capacity value is too large. Please enter a smaller number.",
        variant: "destructive"
      });
      return;
    }

    // Validate session times
    if (values.sessionStartTime && values.sessionEndTime && values.sessionStartTime >= values.sessionEndTime) {
      toast({
        title: "Invalid Session Times",
        description: "Session Start Time must be earlier than Session End Time.",
        variant: "destructive"
      });
      return;
    }

    // Validation for manual schedule
    if (values.schedulePattern === "manual") {
      if (selectedDates.length !== values.noOfSessions) {
        toast({
          title: "Session Count Mismatch",
          description: `Please select exactly ${values.noOfSessions} dates for the manual schedule as per the Number of Sessions. You have selected ${selectedDates.length}.`,
          variant: "destructive",
        });
        return;
      }
    }

    const updatedBatchData: BatchFormData = {
      ...batch,
      name: values.name,
      programId: values.programId as number,
      type: values.type,
      venueId: values.venueId as number,
      venueSpotId: values.venueSpotId,
      partnerIds: values.partnerIds,
      capacity: values.capacity || 0,
      description: values.description || "",
      startDate: values.startDate,
      endDate: values.endDate,
      sessionStartTime: values.sessionStartTime,
      sessionEndTime: values.sessionEndTime,
      noOfSessions: values.noOfSessions || 0, // Use the value from the form field
      schedulePattern: values.schedulePattern,
      amount: values.amount,
      currency: values.currency,
      discountAvailable: values.discountAvailable,
      discountPercentage: values.discountPercentage,
      status: values.status,
      progress: values.progress || 0,
      selectedSessionDates: values.schedulePattern === "manual" 
        ? selectedDates.map(date => format(date, "yyyy-MM-dd")) // Send selected dates if manual
        : []
    };
    onFormSubmit(updatedBatchData);
  };

  // const exampleJoinDate = new Date(2025, 3, 24);
  // const calculateProratedAmount = (
  //   joinDate: Date,
  //   amountStr: string
  // ): number => {
  //   const amount = parseFloat(amountStr);
  //   if (isNaN(amount) || amount <= 0) return 0;
  //   const currentMonth = joinDate.getMonth();
  //   const currentYear = joinDate.getFullYear();
  //   const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  //   const daysRemaining = daysInMonth - joinDate.getDate() + 1;
  //   return Math.round((amount / daysInMonth) * daysRemaining);
  // };
  // const exampleFeeAmount = form.watch("feeConfiguration_amount") || 0;
  // const exampleProratedAmount = calculateProratedAmount(
  //   exampleJoinDate,
  //   exampleFeeAmount.toString()
  // );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Edit Batch: {batch?.name}
          </DialogTitle>
          <DialogDescription>
            Update batch details, schedule, and payment settings.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(processSubmit)}
            className="space-y-6 py-4"
          >
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Batch Details</TabsTrigger>
                <TabsTrigger value="schedule">Schedule</TabsTrigger>
                <TabsTrigger value="fee">Fee Configuration</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Batch Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter batch name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="programId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Program</FormLabel>
                        <Select
                          onValueChange={(value) =>
                            field.onChange(value ? Number(value) : undefined)
                          }
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a program" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {programs.map((program) => (
                              <SelectItem
                                key={program.id}
                                value={program.id.toString()}
                              >
                                {program.name}
                              </SelectItem>
                            ))}
                            {programs.length === 0 && (
                              <SelectItem value="__NO_PROGRAMS__" disabled>
                                No programs
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Batch Type</FormLabel>
                      <FormControl>
                        <RadioGroup
                          value={field.value}
                          onValueChange={field.onChange}
                          className="flex space-x-4"
                        >
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <RadioGroupItem
                                value="fixed"
                                id={`edit-fixed-${batch?.id}`}
                              />
                            </FormControl>
                            <Label
                              htmlFor={`edit-fixed-${batch?.id}`}
                              className="cursor-pointer font-normal"
                            >
                              Fixed
                            </Label>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <RadioGroupItem
                                value="recurring"
                                id={`edit-recurring-${batch?.id}`}
                              />
                            </FormControl>
                            <Label
                              htmlFor={`edit-recurring-${batch?.id}`}
                              className="cursor-pointer font-normal"
                            >
                              Recurring
                            </Label>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="venueId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Venue</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            const numValue = value ? Number(value) : undefined;
                            field.onChange(numValue);
                            if (numValue) {
                              dispatch(fetchVenueSpots(numValue));
                            } else {
                              setAvailableSpots([]);
                            }
                          }}
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a venue" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {venues.map((venue) => (
                              <SelectItem
                                key={venue.id}
                                value={venue.id.toString()}
                              >
                                {venue.name}
                              </SelectItem>
                            ))}
                            {venues.length === 0 && (
                              <SelectItem value="__NO_VENUES__" disabled>
                                No venues
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="venueSpotId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Spot</FormLabel>
                        <Select
                          onValueChange={(value) =>
                            field.onChange(value ? Number(value) : undefined)
                          }
                          value={field.value?.toString()}
                          disabled={
                            !watchedVenueId ||
                            spotsLoading ||
                            availableSpots.length === 0
                          }
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={
                                  spotsLoading
                                    ? "Loading spots..."
                                    : "Select a spot"
                                }
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {!spotsLoading &&
                              availableSpots.length === 0 &&
                              watchedVenueId && (
                                <div
                                  style={{ padding: "8px 12px", color: "grey" }}
                                >
                                  No spots available for this venue.
                                </div>
                              )}
                            {availableSpots.map((spot) => (
                              <SelectItem
                                key={spot.id}
                                value={spot.id.toString()}
                              >
                                {getFormattedSpotName(spot)}
                                {/* Or simply: {spot.name} */}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {spotsError && (
                          <FormMessage style={{ color: "red" }}>
                            {spotsError}
                          </FormMessage>
                        )}
                        <FormMessage />{" "}
                        {/* For react-hook-form validation messages */}
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="capacity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Capacity</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Enter capacity"
                            min="0"
                            max="2147483647"
                            {...field}
                            onChange={(e) => {
                              const value = Number(e.target.value);
                              if (value > 2147483647) {
                                toast({
                                  title: "Invalid Capacity",
                                  description: "Capacity value is too large. Please enter a smaller number.",
                                  variant: "destructive"
                                });
                                return;
                              }
                              field.onChange(e.target.value ? value : undefined);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="partnerIds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Partners</FormLabel>
                      <Popover
                        open={isPartnerPopoverOpen}
                        onOpenChange={setIsPartnerPopoverOpen}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="w-full justify-between"
                          >
                            <div className="flex items-center">
                              <Users className="mr-2 h-4 w-4" />
                              {field.value?.length > 0
                                ? `${field.value.length} partner(s) selected`
                                : "Select partners"}
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
                              value={partnerSearchTerm}
                              autoFocus
                              onValueChange={setPartnerSearchTerm}
                              className="h-9"
                            />
                            <CommandList>
                              <CommandEmpty>No partners found</CommandEmpty>
                              <CommandGroup className="max-h-[200px] overflow-y-auto">
                                {filteredPartners.map((partner) => (
                                  <CommandItem
                                    key={partner.id}
                                    onSelect={() => {
                                      togglePartnerSelection(partner.id);
                                    }}
                                    className="flex items-center justify-between p-2 cursor-pointer"
                                  >
                                    <div className="flex flex-col">
                                      <div className="font-medium">
                                        {partner.name}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        {partner.specialization}
                                      </div>
                                    </div>
                                    {field.value?.includes(partner.id) && (
                                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                                    )}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      {
                      field.value?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {field.value.map((partnerId) => (
                            
                            console.log("Rendering partner badge for ID:", partnerId),
                            <Badge
                              key={partnerId}
                              variant="secondary"
                              className="flex items-center"
                            >
                              {getPartnerNameById(partnerId)}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 w-5 p-0 ml-1 rounded-full hover:bg-primary/20"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  togglePartnerSelection(partnerId);
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </Badge>
                          ))}
                          {field.value.length > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-xs"
                              onClick={handleClearAllPartners}
                            >
                              Clear All
                            </Button>
                          )}
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter batch description"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="schedule" className="space-y-4 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate" // This RHF field stores the date as "yyyy-MM-dd" string
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Batch Start Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  // Use the local `Date` object state for conditional styling
                                  !startDate && "text-muted-foreground"
                                )}
                              >
                                {/* Use the local `Date` object state for display */}
                                {startDate ? (
                                  format(startDate, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <UICalendar
                              mode="single"
                              selected={startDate} // Bind to local `Date` object state
                              onSelect={(selectedDate) => {
                                setStartDateState(selectedDate); // Update local `Date` state
                                // Update RHF field with "yyyy-MM-dd" string
                                field.onChange(selectedDate ? format(selectedDate, "yyyy-MM-dd") : "");
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endDate" 
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Batch End Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !endDate && "text-muted-foreground"
                                )}
                              >
                                {/* Use the local `Date` object state for display */}
                                {endDate ? (
                                  format(endDate, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <UICalendar
                              mode="single"
                              selected={endDate} 
                              onSelect={(selectedDate) => {
                                setEndDateState(selectedDate); 
                                field.onChange(selectedDate ? format(selectedDate, "yyyy-MM-dd") : "");
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="sessionStartTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Session Start Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="sessionEndTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Session End Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="noOfSessions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Sessions</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter number of sessions"
                          {...field}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value
                                ? Math.max(0, Number(e.target.value)) // Ensure non-negative
                                : 0 // Default to 0 if empty or invalid
                            )
                          }
                        />
                        
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="schedulePattern"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Schedule Pattern</FormLabel>
                      <FormControl>
                        <RadioGroup
                          value={field.value}
                          onValueChange={field.onChange}
                          className="grid grid-cols-2 md:grid-cols-4 gap-2"
                        >
                          <FormItem className="flex items-center space-x-2 border rounded-md p-3">
                            <FormControl>
                              <RadioGroupItem
                                value="MWF"
                                id={`edit-mwf-${batch?.id}`}
                              />
                            </FormControl>
                            <Label
                              htmlFor={`edit-mwf-${batch?.id}`}
                              className="cursor-pointer font-normal"
                            >
                              Mon-Wed-Fri
                            </Label>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 border rounded-md p-3">
                            <FormControl>
                              <RadioGroupItem
                                value="TTS"
                                id={`edit-tts-${batch?.id}`}
                              />
                            </FormControl>
                            <Label
                              htmlFor={`edit-tts-${batch?.id}`}
                              className="cursor-pointer font-normal"
                            >
                              Tue-Thu-Sat
                            </Label>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 border rounded-md p-3">
                            <FormControl>
                              <RadioGroupItem
                                value="weekend"
                                id={`edit-weekend-${batch?.id}`}
                              />
                            </FormControl>
                            <Label
                              htmlFor={`edit-weekend-${batch?.id}`}
                              className="cursor-pointer font-normal"
                            >
                              Weekend Only
                            </Label>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 border rounded-md p-3">
                            <FormControl>
                              <RadioGroupItem
                                value="manual"
                                id={`edit-manual-${batch?.id}`}
                              />
                            </FormControl>
                            <Label
                              htmlFor={`edit-manual-${batch?.id}`}
                              className="cursor-pointer font-normal"
                            >
                              Manual Selection
                            </Label>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {showManualCalendar && startDate && endDate && (
                  <div className="col-span-2 border rounded-md p-4 bg-gray-50">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium">
                        Manually Select Session Dates
                      </h4>
                      <div className="text-sm text-muted-foreground">
                        Selected: {selectedDates.length}/{targetNumSessions}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
                      <Info className="w-4 h-4" />
                      <p>
                        Select exactly {targetNumSessions} dates between{" "}
                        {format(startDate, "MMM d, yyyy")} and{" "}
                        {format(endDate, "MMM d, yyyy")}
                      </p>
                    </div>
                    {selectedDates.length > 0 && (
                      <div className="mb-4">
                        <Label className="mb-2 block">
                          Selected Session Dates:
                        </Label>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {selectedDates
                            .sort((a, b) => a.getTime() - b.getTime())
                            .map((date) => (
                              <Badge
                                key={date.toISOString()}
                                variant="secondary"
                                className="flex items-center gap-1"
                              >
                                {format(date, "MMM d, yyyy")}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-4 w-4 p-0 ml-1"
                                  onClick={() => removeSelectedDate(date)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </Badge>
                            ))}
                        </div>
                        <Separator className="my-3" />
                      </div>
                    )}
                    <div className="bg-white rounded-md p-3">
                      <UICalendar
                        mode="multiple"
                        selected={selectedDates}
                        onSelect={handleDateSelect}
                        disabled={(date) =>
                          !startDate ||
                          !endDate ||
                          date < startDate ||
                          date > endDate
                        }
                        className="p-3 pointer-events-auto"
                      />
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="fee" className="space-y-4 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Enter amount"
                            {...field}
                            onChange={(e) =>
                              field.onChange(e.target.value ? Number(e.target.value) : 0)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="INR">₹ (INR)</SelectItem>
                            <SelectItem value="USD">$ (USD)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="discountAvailable"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Apply Discount</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Enable discount on this batch fee
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                {form.watch("discountAvailable") && (
                  <FormField
                    control={form.control}
                    name="discountPercentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Discount Percentage</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            placeholder="Enter %"
                            {...field}
                            onChange={(e) =>
                              field.onChange(e.target.value ? Number(e.target.value) : 0)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </TabsContent>
            </Tabs>

            <div className="flex justify-end space-x-2 pt-4 border-t mt-6">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting || dataLoading}
              >
                {form.formState.isSubmitting || dataLoading
                  ? "Saving..."
                  : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditBatchForm;
