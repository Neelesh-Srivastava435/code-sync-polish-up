import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash, ToggleLeft, ToggleRight, MapPin, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { Venue, VenueSpot } from "../../pages/VenueManagement";
import AddVenueDialog from './AddVenueDialog';
import { useToast } from "@/hooks/use-toast";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks/hooks';
import { addSpot, deleteVenue, updateSpot, updateVenue } from '@/store/venue/venueSlice';

interface VenueTableProps {
  // venues: Venue[];
}

const VenueTable: React.FC<VenueTableProps> = () => {
  const [venueToDelete, setVenueToDelete] = useState<number | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [venueToEdit, setVenueToEdit] = useState<Venue | undefined>(undefined);
  const [expandedVenues, setExpandedVenues] = useState<number[]>([]);
  const [viewDetailsVenue, setViewDetailsVenue] = useState<Venue | null>(null);
  const [venueToEditId, setVenueToEditId] = useState<number | undefined>(undefined);

  const { venues } = useAppSelector((state) => state.venues);
  const { toast } = useToast();
  const dispatch = useAppDispatch();

  // Default image for venues and spots without images
  const defaultVenueImage = "https://images.unsplash.com/photo-1487958449943-2429e8be8625";

  const toggleVenueStatus = async (venue: Venue) => {
    if (venue.status === 'deleted') return;
    try {
      const updatedVenue: Venue = {
        ...venue,
        status: venue.status === "active" ? "inactive" : "active"
      };
      await dispatch(updateVenue(updatedVenue)).unwrap();
      toast({
        title: "Venue Status Updated",
        description: `The venue status has been updated to ${updatedVenue.status}.`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update venue status.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteVenue = async () => {
    if (venueToDelete) {
      try {
        await dispatch(deleteVenue(venueToDelete)).unwrap();
        setVenueToDelete(null);
        toast({
          title: "Venue Deleted",
          description: "The venue has been successfully deleted."
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete venue.",
          variant: "destructive",
        });
      }
    }
  };

  const handleEditVenue = (venue: Venue) => {
    setVenueToEditId(venue.venue_id);
    setVenueToEdit(venue);
    setIsEditDialogOpen(true);
  };

  const handleSaveEditedVenue = async (editedVenue: Omit<Venue, 'venue_id' | 'status' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'peak_occupancy' | 'total_events' | 'revenue_generated'>, venue_admin_ids?: number[]): Promise<Venue | undefined> => {
    if (!venueToEdit) return undefined;
    const updatedVenue: Venue = {
      ...venueToEdit,
      ...editedVenue,
      venue_admins: venueToEdit.venue_admins,
      venue_spots: venueToEdit.venue_spots, // **Include existing spots**
    };

    try {
      const response = await dispatch(updateVenue({ ...updatedVenue, venue_admin_ids })).unwrap();
      toast({
        title: "Venue Updated",
        description: `${editedVenue.venue_name} has been successfully updated.`
      });
      setVenueToEdit(response)
      return response;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update venue.",
        variant: "destructive",
      });
      return undefined;
    }
    finally{
      setVenueToEdit(undefined);
    }
  };

  const handleSaveEditedSpot = async (venueId: number, spot: Omit<VenueSpot, 'venue_spot_id' | 'created_by' | 'updated_by'>, spotId?: number): Promise<boolean> => {
    try {
      if (spotId) {
        await dispatch(updateSpot({ ...spot, venue_spot_id: spotId, venue_id: venueId })).unwrap();
      } else {
        await dispatch(addSpot({ ...spot, venue_id: venueId })).unwrap();
      }
      return true;
    } catch (error) {
      // Log the error to the console
      console.error("Error saving spot:", error);
      // Check if the error has a response and data
      if (error?.response?.data) {
        console.error("Error details:", error.response.data);
        // Check if the error has errors
        if (error.response.data.errors) {
          // Log the errors
          console.error("Validation errors:", error.response.data.errors);
        }
      }
      return false;
    }
  };

  const toggleVenueExpansion = (venueId: number) => {
    setExpandedVenues(prevState => {
      if (prevState.includes(venueId)) {
        return prevState.filter(id => id !== venueId);
      } else {
        return [...prevState, venueId];
      }
    });
  };

  const handleViewDetails = (venue: Venue) => {
    setViewDetailsVenue(venue);
  };

  return (
    <div className="space-y-4">
      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"></TableHead>
              <TableHead className="w-12"></TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {venues.map((venue) => (
              <React.Fragment key={venue.venue_id}>
                <TableRow className="group border-b-0">
                  <TableCell className="w-10">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleVenueExpansion(venue.venue_id)}
                      className="h-8 w-8 p-0"
                    >
                      {expandedVenues.includes(venue.venue_id) ?
                        <ChevronUp size={16} /> :
                        <ChevronDown size={16} />
                      }
                    </Button>
                  </TableCell>
                  <TableCell className="w-12">
                    <div className="h-10 w-10 rounded-md overflow-hidden">
                      <img 
                        src={venue.venue_image || defaultVenueImage} 
                        alt={venue.venue_name}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = defaultVenueImage;
                        }}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{venue.venue_name}</TableCell>
                  <TableCell>{venue.address}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      venue.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {venue.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(venue)}
                        title="View Venue Details"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditVenue(venue)}
                        title="Edit Venue"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleVenueStatus(venue)}
                        title={venue.status === "active" ? "Deactivate Venue" : "Activate Venue"}
                      >
                        {venue.status === "active" ? (
                          <ToggleRight className="h-4 w-4 text-green-600" />
                        ) : (
                          <ToggleLeft className="h-4 w-4 text-red-600" />
                        )}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setVenueToDelete(venue.venue_id)}
                            title="Delete Venue"
                          >
                            <Trash className="h-4 w-4 text-red-500" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete the venue "{venue.venue_name}". This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleDeleteVenue}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
                {Array.isArray(venue.venue_spots) && venue.venue_spots.length > 0 && venue.venue_spots.map((spot) => (
                  <TableRow key={`${venue.venue_id}-${spot.venue_spot_id}`} className={`bg-gray-50 ${!expandedVenues.includes(venue.venue_id) ? 'hidden' : ''}`}>
                    <TableCell className="w-10"></TableCell>
                    <TableCell className="w-12 pl-10">
                      <div className="h-8 w-8 rounded-md overflow-hidden">
                        <img 
                          src={spot.spot_image || defaultVenueImage} 
                          alt={spot.spot_name}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = defaultVenueImage;
                          }}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-1 text-gray-700">
                        <MapPin size={14} className="text-gray-500" />
                        {spot.spot_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-gray-500">
                        Area: {spot.area} sqft • Capacity: {spot.capacity}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-gray-500">
                        {spot.start_time} - {spot.end_time}
                      </span>
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                ))}
                {expandedVenues.includes(venue.venue_id) && (!venue.venue_spots || venue.venue_spots.length === 0) && (
                  <TableRow className="bg-gray-50">
                    <TableCell colSpan={6} className="text-center py-4 text-sm text-gray-500">
                      No spots available for this venue.
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-gray-500">
        Manage venue operations like add/update and disable venues.
      </div>

      <AddVenueDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSave={handleSaveEditedVenue}
        onSaveSpot={handleSaveEditedSpot}
        editVenue={venueToEditId}
      />

      {/* Venue Details Dialog */}
      <Dialog open={!!viewDetailsVenue} onOpenChange={(open) => !open && setViewDetailsVenue(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Venue Details</DialogTitle>
          </DialogHeader>

          {viewDetailsVenue && (
            <div className="space-y-6">
              {/* Venue image */}
              {viewDetailsVenue.venue_image && (
                <div className="w-full h-48 rounded-lg overflow-hidden">
                  <img 
                    src={viewDetailsVenue.venue_image} 
                    alt={viewDetailsVenue.venue_name}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = defaultVenueImage;
                    }}
                  />
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-lg font-medium">{viewDetailsVenue.venue_name}</h3>
                  <p className="text-gray-500">{viewDetailsVenue.address}</p>
                  <div className="mt-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      viewDetailsVenue.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {viewDetailsVenue.status}
                    </span>
                  </div>
                  {viewDetailsVenue.description && (
                    <p className="mt-4 text-sm">{viewDetailsVenue.description}</p>
                  )}
                </div>

                <div className="bg-gray-50 p-4 rounded-md">
                  <h4 className="font-medium mb-2">Venue Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">ID:</span>
                      <span>{viewDetailsVenue.venue_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Total Spots:</span>
                      <span>{viewDetailsVenue.venue_spots?.length || 0}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-md font-medium mb-3">Venue Spots</h4>
                {viewDetailsVenue.venue_spots && viewDetailsVenue.venue_spots.length > 0 ? (
                  <div className="space-y-4">
                    {viewDetailsVenue.venue_spots.map((spot) => (
                      <div key={spot.venue_spot_id} className="border rounded-md p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex gap-4">
                            {/* Spot image */}
                            {spot.spot_image && (
                              <div className="h-16 w-16 rounded-md overflow-hidden flex-shrink-0">
                                <img 
                                  src={spot.spot_image} 
                                  alt={spot.spot_name}
                                  className="h-full w-full object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = defaultVenueImage;
                                  }}
                                />
                              </div>
                            )}
                            <div>
                              <h5 className="font-medium">{spot.spot_name}</h5>
                              <div className="grid grid-cols-2 gap-x-8 gap-y-2 mt-2 text-sm">
                                <div>
                                  <span className="text-gray-500">Area:</span> {spot.area} sqft
                                </div>
                                <div>
                                  <span className="text-gray-500">Capacity:</span> {spot.capacity}
                                </div>
                                <div>
                                  <span className="text-gray-500">Hours:</span> {spot.start_time} - {spot.end_time}
                                </div>
                                <div>
                                  <span className="text-gray-500">Days:</span> {spot.operative_days.length} days/week
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-md">
                    <p className="text-gray-500">No spots available for this venue.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VenueTable;
