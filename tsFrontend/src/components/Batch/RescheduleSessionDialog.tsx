import React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Clock } from 'lucide-react'; // Added Clock icon
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input'; // Added Input for time
import { cn } from '@/lib/utils';
import { Session } from '@/types/session';
import { useToast } from '@/hooks/use-toast';

interface RescheduleSessionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedSession: Session | null;
  newDate: Date | undefined;
  setNewDate: (date: Date | undefined) => void;
  newStartTime: string; // Added newStartTime
  setNewStartTime: (time: string) => void; // Added setNewStartTime
  newEndTime: string; // Added newEndTime
  setNewEndTime: (time: string) => void; // Added setNewEndTime
  rescheduleReason: string;
  setRescheduleReason: (reason: string) => void;
  handleRescheduleSubmit: () => void;
  disabledDates: (date: Date) => boolean;
  isSubmitting: boolean;
  sessionNumber?: number;
}

const RescheduleSessionDialog: React.FC<RescheduleSessionDialogProps> = ({
  isOpen,
  onOpenChange,
  selectedSession,
  newDate,
  setNewDate,
  newStartTime,
  setNewStartTime,
  newEndTime,
  setNewEndTime,
  rescheduleReason,
  setRescheduleReason,
  handleRescheduleSubmit,
  disabledDates,
  isSubmitting,
  sessionNumber
}) => {
  const originalDate = selectedSession?.date ? new Date(selectedSession.date) : undefined;
  const originalStartTime = selectedSession?.start_time || '';
  const originalEndTime = selectedSession?.end_time || '';
  const { toast } = useToast();

  // Initialize time fields with original session times when dialog opens for a selected session
  React.useEffect(() => {
    if (isOpen && selectedSession) {
      setNewStartTime(selectedSession.start_time || '');
      setNewEndTime(selectedSession.end_time || '');
    }
  }, [isOpen, selectedSession, setNewStartTime, setNewEndTime]);

  const handleSubmit = () => {
    if (!rescheduleReason.trim()) {
      toast({
        title: "Required Field Missing",
        description: "Please provide a reason for rescheduling",
        variant: "destructive",
      });
      return;
    }

    // Validate that end time is after start time
    if (newStartTime && newEndTime && (newEndTime <= newStartTime)) {
      toast({
        title: "Invalid Time",
        description: "End time must be after start time.",
        variant: "destructive",
      });
      return;
    }
    handleRescheduleSubmit();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reschedule Session {sessionNumber}</DialogTitle>
          <DialogDescription>
            Update the date and time for Session {sessionNumber}.
            {originalDate && (
              <span className="block mt-1 text-xs text-gray-500">
                Original: {format(originalDate, 'MMM d, yyyy')} from {originalStartTime} to {originalEndTime}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label htmlFor="date" className="text-sm font-medium">New Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !newDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {newDate ? format(newDate, "PPP") : <span>Select a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={newDate}
                  onSelect={setNewDate}
                  disabled={disabledDates}
                  initialFocus
                  fromDate={new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label htmlFor="startTime" className="text-sm font-medium">New Start Time</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <Input
                  id="startTime"
                  type="time"
                  value={newStartTime}
                  onChange={(e) => setNewStartTime(e.target.value)}
                  className="pl-10" // Add padding for the icon
                />
              </div>
            </div>
            <div className="grid gap-2">
              <label htmlFor="endTime" className="text-sm font-medium">New End Time</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <Input
                  id="endTime"
                  type="time"
                  value={newEndTime}
                  onChange={(e) => setNewEndTime(e.target.value)}
                  className="pl-10" // Add padding for the icon
                />
              </div>
            </div>
          </div>
          
          <div className="grid gap-2">
            <label htmlFor="reason" className="text-sm font-medium">Reason for Rescheduling</label>
            <Textarea
              id="reason"
              value={rescheduleReason}
              onChange={(e) => setRescheduleReason(e.target.value)}
              placeholder="Please provide a reason for rescheduling this session..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            onClick={handleSubmit}
            disabled={!newDate || !newStartTime || !newEndTime || isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Reschedule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RescheduleSessionDialog;
