import React, { useState, useEffect } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarIcon, Plus, Trash2 } from 'lucide-react';
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO, isBefore, startOfDay } from "date-fns";
import { DateRange } from "react-day-picker";
import { useIsMobile, BREAKPOINTS } from "@/hooks/use-mobile";
import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks/hooks';
import {
  addVenueHoliday,
  clearError,
  deleteVenueHoliday,
  fetchVenueNamesAndHolidays,
  Holiday,
  VenueNameAndHolidays,
  AddVenueHolidayPayload,
} from '@/store/venue/holidaySlice';
import { fetchVenues } from '@/store/venue/venueSlice';

import { weekDays } from '@/constants/index';

interface HolidayValidationErrors {
  holidayName?: string;
  specificDate?: string;
  dateRange?: string;
  venue?: string;
}

const VenueHolidays: React.FC = () => {
  const [selectedVenue, setSelectedVenue] = useState<number | null>(null);
  const [holidayName, setHolidayName] = useState<string>("");
  const [holidayType, setHolidayType] = useState<"specific" | "recurring">("specific");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: undefined,
    to: undefined
  });
  const [isRangeSelection, setIsRangeSelection] = useState<boolean>(false);
  const [recurringDay, setRecurringDay] = useState<number>(0);
  const [validationErrors, setValidationErrors] = useState<HolidayValidationErrors>({});

  const { toast } = useToast();
  const isMobile = useIsMobile(BREAKPOINTS.TABLET);
  const dispatch = useAppDispatch();
  const { venues } = useAppSelector((state) => state.venues);
  const { venueNamesAndHolidays, loading, error } = useAppSelector((state) => state.holidays);

  useEffect(() => {
    dispatch(fetchVenueNamesAndHolidays());
  }, [dispatch]);

  useEffect(() => {
    if (venues.length > 0 && selectedVenue === null) {
      setSelectedVenue(venues[0].venue_id);
    }
  }, [venues, selectedVenue]);

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
      dispatch(clearError());
    }
  }, [error, toast, dispatch]);

  const validateForm = (): boolean => {
    const errors: HolidayValidationErrors = {};
    let isValid = true;

    if (!selectedVenue) {
      errors.venue = "Please select a venue.";
      isValid = false;
    }

    if (!holidayName.trim()) {
      errors.holidayName = "Holiday name is required.";
      isValid = false;
    }

    if (holidayType === "specific") {
      if (isRangeSelection) {
        if (!dateRange?.from) {
          errors.dateRange = "Start date is required for range selection.";
          isValid = false;
        }
        if (!dateRange?.to) {
          errors.dateRange = errors.dateRange ? errors.dateRange + " End date is required." : "End date is required for range selection.";
          isValid = false;
        }
        if (dateRange?.from && dateRange?.to) {
          if (isBefore(startOfDay(dateRange.to), startOfDay(dateRange.from))) {
            errors.dateRange = "End date cannot be before start date.";
            isValid = false;
          } else if (format(dateRange.from, 'yyyy-MM-dd') === format(dateRange.to, 'yyyy-MM-dd')) {
            errors.dateRange = "Start date and end date cannot be the same for a range.";
            isValid = false;
          }
        }
      } else {
        if (!selectedDate) {
          errors.specificDate = "Please select a date for the holiday.";
          isValid = false;
        }
      }
    }
    setValidationErrors(errors);
    return isValid;
  };

  const handleAddHoliday = async () => {
    if (!validateForm()) {
      return;
    }

    const selectedVenueName = venues.find(v => v.venue_id === selectedVenue)?.venue_name;
    if (!selectedVenueName) {
      toast({
        title: "Error",
        description: "Could not find venue name. Please try again.",
        variant: "destructive",
      });
      return;
    }

    const newHoliday: AddVenueHolidayPayload = {
      venue_id: selectedVenue!,
      venue_name: selectedVenueName,
      name: holidayName,
      holiday_type: holidayType,
      date: holidayType === "specific" && !isRangeSelection && selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null,
      start_date: holidayType === "specific" && isRangeSelection && dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : null,
      end_date: holidayType === "specific" && isRangeSelection && dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : null,
      recurring_day: holidayType === "recurring" ? recurringDay : null,
    };

    try {
      await dispatch(addVenueHoliday(newHoliday)).unwrap();
      toast({
        title: "Holiday Added",
        description: `${holidayName} has been added to the calendar.`,
      });
      resetForm();
    } catch (err: any) {
     // Error is handled by the useEffect hook for 'error' state
    }
  };

  const handleDeleteHoliday = async (id: number) => {
    if (!selectedVenue) {
      setValidationErrors(prev => ({ ...prev, venue: "Please select a venue to delete its holiday." }));
      toast({
        title: "No Venue Selected",
        description: "Please select a venue before deleting a holiday.",
        variant: "destructive",
      });
      return;
    }
    try {
      await dispatch(deleteVenueHoliday({ id, venueId: selectedVenue })).unwrap();
      toast({
        title: "Holiday Removed",
        description: "The holiday has been removed from the calendar.",
      });
    } catch (err: any) {
      // Error is handled by the useEffect hook for 'error' state
    }
  };

  const formatHolidayDate = (holiday: Holiday): string => {
    if (holiday.holiday_type === 'recurring' && holiday.recurring_day !== null) {
      return `Every ${weekDays.find(d => d.id === holiday.recurring_day)?.name}`;
    }
    if (holiday.holiday_type === 'specific' && holiday.start_date && holiday.end_date) {
      return `${format(parseISO(holiday.start_date), "PPP")} - ${format(parseISO(holiday.end_date), "PPP")}`;
    }
    if (holiday.holiday_type === 'specific' && holiday.date) {
      return format(parseISO(holiday.date), "PPP");
    }
    return "No date specified";
  };

  const resetForm = () => {
    setHolidayName("");
    setHolidayType("specific");
    setSelectedDate(new Date());
    setDateRange({ from: undefined, to: undefined }); // Reset range with undefined 'from' and 'to'
    setIsRangeSelection(false);
    setRecurringDay(0);
    setValidationErrors({});
  };

  const getHolidaysForSelectedVenue = (): Holiday[] => {
    if (!selectedVenue) return [];
    const venue = venueNamesAndHolidays.find(v => v.venue_id === selectedVenue);
    return venue ? venue.holidays : [];
  };

  const handleHolidayTypeChange = (value: "specific" | "recurring") => {
    setHolidayType(value);
    setValidationErrors(prev => ({ ...prev, specificDate: undefined, dateRange: undefined }));
    if (value === "recurring") {
      setRecurringDay(0); // Default to Sunday or first day in weekDays
    } else {
      // When switching back to specific, reset dates based on isRangeSelection
      if (isRangeSelection) {
        setDateRange({ from: undefined, to: undefined });
        setSelectedDate(undefined);
      } else {
        setSelectedDate(new Date());
        setDateRange({ from: undefined, to: undefined });
      }
    }
  };

  const handleHolidayNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHolidayName(e.target.value);
    if (validationErrors.holidayName) {
      setValidationErrors(prev => ({ ...prev, holidayName: undefined }));
    }
  };

  const handleSelectedVenueChange = (value: string) => {
    setSelectedVenue(parseInt(value));
    if (validationErrors.venue) {
      setValidationErrors(prev => ({ ...prev, venue: undefined }));
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (validationErrors.specificDate) {
      setValidationErrors(prev => ({ ...prev, specificDate: undefined }));
    }
  };

  const handleDateRangeSelect = (range: DateRange | undefined) => {
    setDateRange(range);
    if (validationErrors.dateRange) {
      setValidationErrors(prev => ({ ...prev, dateRange: undefined }));
    }
  };
  
  const handleIsRangeSelectionChange = (checked: boolean | "indeterminate") => {
    const isNowRange = !!checked;
    setIsRangeSelection(isNowRange);
    if (isNowRange) {
      // When switching to range selection, clear specific date and reset range
      setSelectedDate(undefined);
      setDateRange({ from: undefined, to: undefined });
    } else {
      // When switching to single date selection, set a default date and clear range
      setSelectedDate(new Date());
      setDateRange({ from: undefined, to: undefined });
    }
    // Clear any previous date-related validation errors
    setValidationErrors(prev => ({ ...prev, specificDate: undefined, dateRange: undefined }));
  };


  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">Mark Holidays / Days Off</h3>
        <p className="text-sm text-gray-500">
          Configure holidays and days off for venues to manage availability
        </p>
      </div>

      {venues.length === 0 ? (
        <p>No venues available. Please add a venue first.</p>
      ) : (
        <>
          <div className="flex space-x-4 mb-4 overflow-x-auto">
            <div className="space-y-1">
              <Select
                value={selectedVenue !== null ? selectedVenue.toString() : ""}
                onValueChange={handleSelectedVenueChange}
                disabled={venues.length === 0}
              >
                <SelectTrigger className={`w-[200px] ${validationErrors.venue ? 'border-red-500' : ''}`}>
                  <SelectValue placeholder="Select Venue">
                    {selectedVenue
                      ? venues.find(v => v.venue_id === selectedVenue)?.venue_name
                      : "Select Venue"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {venues
                    .filter(venue => venue.status === 'active')
                    .map((venue) => (
                      <SelectItem key={venue.venue_id} value={venue.venue_id.toString()}>
                        {venue.venue_name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {validationErrors.venue && <p className="text-xs text-red-500">{validationErrors.venue}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`${isMobile ? '' : 'md:col-span-2'}`}>
              <Card>
                <CardHeader>
                  <CardTitle>Add Holiday</CardTitle>
                  <CardDescription>
                    Mark specific dates or recurring days as holidays or days off
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="holidayName">Holiday Name</Label>
                      <Input
                        id="holidayName"
                        placeholder="e.g., Christmas Day"
                        value={holidayName}
                        onChange={handleHolidayNameChange}
                        className={validationErrors.holidayName ? 'border-red-500' : ''}
                      />
                      {validationErrors.holidayName && <p className="text-xs text-red-500 mt-1">{validationErrors.holidayName}</p>}
                    </div>

                    <Tabs defaultValue="specific" value={holidayType} onValueChange={(value) => handleHolidayTypeChange(value as "specific" | "recurring")}>
                      <TabsList className="grid grid-cols-2">
                        <TabsTrigger value="specific">Specific Date(s)</TabsTrigger>
                        <TabsTrigger value="recurring">Recurring Weekly</TabsTrigger>
                      </TabsList>

                      <TabsContent value="specific" className="space-y-4">
                        <div className="flex items-center space-x-2 mt-4">
                          <Checkbox
                            id="dateRange"
                            checked={isRangeSelection}
                            onCheckedChange={handleIsRangeSelectionChange}
                          />
                          <Label htmlFor="dateRange">Date Range</Label>
                        </div>

                        {isRangeSelection ? (
                          <div className={`border rounded-md p-4 overflow-auto ${validationErrors.dateRange ? 'border-red-500' : ''}`}>
                            <p className="text-sm text-gray-500 mb-2">Select start and end dates</p>
                            <div className="flex justify-center">
                              <Calendar
                                mode="range"
                                selected={dateRange}
                                onSelect={handleDateRangeSelect}
                                className="rounded-md border max-w-full"
                                disabled={{ before: new Date() }}
                                // numberOfMonths={isMobile ? 1 : 2} // Optional: show 2 months on wider screens
                              />
                            </div>
                            {dateRange?.from && dateRange?.to && (
                              <p className="text-sm mt-2 text-center">
                                <span className="font-medium">Selected range:</span>{' '}
                                {format(dateRange.from, "PPP")} – {format(dateRange.to, "PPP")}
                              </p>
                            )}
                             {validationErrors.dateRange && <p className="text-xs text-red-500 mt-1 text-center">{validationErrors.dateRange}</p>}
                          </div>
                        ) : (
                          <div className={`border rounded-md p-4 overflow-auto ${validationErrors.specificDate ? 'border-red-500' : ''}`}>
                            <p className="text-sm text-gray-500 mb-2">Select date</p>
                            <div className="flex justify-center">
                              <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={handleDateSelect}
                                className="rounded-md border max-w-full"
                                disabled={{ before: new Date() }}
                              />
                            </div>
                            {validationErrors.specificDate && <p className="text-xs text-red-500 mt-1 text-center">{validationErrors.specificDate}</p>}
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="recurring" className="space-y-4">
                        <div className="mt-4">
                          <Label htmlFor="recurringDay">Day of Week</Label>
                          <Select
                            value={recurringDay.toString()}
                            onValueChange={(value) => setRecurringDay(parseInt(value))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select Day" />
                            </SelectTrigger>
                            <SelectContent>
                              {weekDays.map((day) => (
                                <SelectItem key={day.id} value={day.id.toString()}>
                                  {day.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <p className="text-sm text-gray-500 mt-2">
                            This will mark every {weekDays.find(d => d.id === recurringDay)?.name} as a holiday.
                          </p>
                        </div>
                      </TabsContent>
                    </Tabs>
                    <Button onClick={handleAddHoliday} className="flex items-center gap-2">
                      {/* <Plus size={16} /> */}
                      Add Holiday
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Holiday Calendar</CardTitle>
                  <CardDescription>
                    Upcoming holidays and days off for {selectedVenue ? venues.find(v => v.venue_id === selectedVenue)?.venue_name : "selected venue"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 overflow-auto max-h-[400px]">
                    {loading && venueNamesAndHolidays.length > 0 ? (
                      <p>Loading holidays for selected venue...</p>
                    ) : getHolidaysForSelectedVenue().length === 0 ? (
                      <p className="text-sm text-gray-500">No holidays configured yet for this venue.</p>
                    ) : (
                      getHolidaysForSelectedVenue().map((holiday) => (
                        <div key={holiday.id} className="flex justify-between items-start border-b pb-2">
                          <div className="pr-2 flex-1">
                            <p className="font-medium truncate">{holiday.name}</p>
                            <p className="text-sm text-gray-500 break-words">{formatHolidayDate(holiday)}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteHoliday(holiday.id)}
                            className="flex-shrink-0"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default VenueHolidays;
