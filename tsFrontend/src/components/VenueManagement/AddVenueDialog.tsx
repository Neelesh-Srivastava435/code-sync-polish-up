import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, MapPin, X, Users, Check, ChevronDown, Camera, Image } from 'lucide-react';
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AddVenueSpots from './AddVenueSpots';
import { Venue, VenueSpot } from '../../pages/VenueManagement';
import { useAppSelector, useAppDispatch } from '@/hooks/reduxHooks/hooks';
import { fetchVenueAdmins } from '@/store/user/userSlice';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { uploadVenueImage, uploadSpotImage } from '@/store/venue/venueSlice';

interface AddVenueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (
    venue: Omit<Venue, 'venue_id' | 'status' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'peak_occupancy' | 'total_events' | 'revenue_generated'> & { venue_spots?: VenueSpot[] },
    venue_admin_ids?: number[]
  ) => Promise<Venue | undefined>;
  onSaveSpot: (venueId: number, spot: Omit<VenueSpot, 'venue_spot_id' | 'created_by' | 'updated_by'>, spotId?: number) => Promise<boolean>;
  editVenue?: number;
}

const AddVenueDialog: React.FC<AddVenueDialogProps> = ({ open, onOpenChange, onSave, onSaveSpot, editVenue }) => {
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const { venueAdmins, loading: usersLoading, error: usersError } = useAppSelector((state) => state.users);
  const [formData, setFormData] = useState({
    venue_name: "",
    address: "",
    description: "",
    venue_admin_ids: [] as number[],
  });
  const [showMapDialog, setShowMapDialog] = useState(false);
  const [showAddSpotsDialog, setShowAddSpotsDialog] = useState(false);
  const [showSpotsManagement, setShowSpotsManagement] = useState(false);
  const [locationCoordinates, setLocationCoordinates] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const { venues } = useAppSelector((state) => state.venues);
  const [currentEditVenueId, setCurrentEditVenueId] = useState<number | undefined>(undefined);
  const [isAdminPopoverOpen, setIsAdminPopoverOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState("details");

  // Image handling state
  const [venueImageUrl, setVenueImageUrl] = useState("");
  const [venueImageFile, setVenueImageFile] = useState<File | null>(null);
  const [spotImages, setSpotImages] = useState<{ [key: number]: { file: File | null; url: string } }>({});

  // Reset form to initial empty state
  const resetToEmptyForm = useCallback(() => {
    setFormData({
      venue_name: "",
      address: "",
      description: "",
      venue_admin_ids: [],
    });
    setLocationCoordinates("");
    setSearchTerm("");
    setIsAdminPopoverOpen(false);
    // Reset image states
    setVenueImageUrl("");
    setVenueImageFile(null);
    setSpotImages({});
  }, []);

  // Reset form to venue's original values
  const resetToVenueData = useCallback((venueId: number) => {
    const venue = venues.find(v => v.venue_id === venueId);
    if (venue) {
      setFormData({
        venue_name: venue.venue_name || "",
        address: venue.address || "",
        description: venue.description || "",
        venue_admin_ids: venue.venue_admins?.map(admin => admin.id) || []
      });
      setLocationCoordinates("");
      setSearchTerm("");
      setIsAdminPopoverOpen(false);
      // Reset image states and set venue image if exists
      setVenueImageUrl(venue.venue_image || "");
      setVenueImageFile(null);
      
      // Reset spot images
      const newSpotImages: { [key: number]: { file: File | null; url: string } } = {};
      venue.venue_spots?.forEach(spot => {
        if (spot.spot_image) {
          newSpotImages[spot.venue_spot_id] = {
            file: null,
            url: spot.spot_image
          };
        }
      });
      setSpotImages(newSpotImages);
    }
  }, [venues]);

  // Handle dialog close
  const handleDialogClose = useCallback((open: boolean) => {
    if (!open) {
      if (isEditMode && editVenue) {
        resetToVenueData(editVenue);
      } else {
        resetToEmptyForm();
      }
    }
    onOpenChange(open);
  }, [isEditMode, editVenue, resetToVenueData, resetToEmptyForm, onOpenChange]);

  useEffect(() => {
    if (open) {
      dispatch(fetchVenueAdmins());
      if (editVenue) {
        const venue = venues.find(v => v.venue_id === editVenue);
        if (venue) {
          setIsEditMode(true);
          resetToVenueData(editVenue);
          setCurrentEditVenueId(editVenue);
        } else {
          console.warn(`Venue with ID ${editVenue} not found.`);
          setIsEditMode(false);
          resetToEmptyForm();
        }
      } else {
        setIsEditMode(false);
        resetToEmptyForm();
        setCurrentEditVenueId(undefined);
      }
    }
  }, [open, editVenue, venues, dispatch, resetToEmptyForm, resetToVenueData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleShareLocation = () => {
    if (locationCoordinates) {
      navigator.clipboard.writeText(locationCoordinates);
      toast({
        title: "Location Copied",
        description: "Location coordinates copied to clipboard."
      });
    }
  };

  const handleFindOnMap = () => {
    setTimeout(() => {
      setLocationCoordinates("40.7128° N, 74.0060° W");
      setFormData({
        ...formData,
        address: formData.address || "350 Fifth Avenue, New York, NY 10118"
      });
      setShowMapDialog(false);

      toast({
        title: "Location Selected",
        description: "The location has been added to the venue details."
      });
    }, 500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.venue_name || !formData.address) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    const savedVenue = await onSave({
      venue_name: formData.venue_name,
      address: formData.address,
      description: formData.description,
      venue_spots: []
    }, formData.venue_admin_ids);

    if (savedVenue) {
      setCurrentEditVenueId(savedVenue.venue_id);

      // Upload venue image if exists
      if (venueImageFile) {
        try {
          await dispatch(uploadVenueImage({
            venueId: savedVenue.venue_id,
            file: venueImageFile
          })).unwrap();
        } catch (error) {
          toast({
            title: "Warning",
            description: "Venue was created but image upload failed.",
            variant: "destructive",
          });
        }
      }
      
      if (isEditMode) {
        handleDialogClose(false);
        setShowSpotsManagement(true);
        return;
      }

      resetToEmptyForm();
      setShowAddSpotsDialog(true);
    } else {
      toast({
        title: "Error",
        description: "Failed to save the venue.",
        variant: "destructive"
      });
    }
  };

  const handleAddSpots = () => {
    onOpenChange(false);
    setShowAddSpotsDialog(false);
    setShowSpotsManagement(true);
  };

  const handleManageSpots = () => {
    onOpenChange(false);
    setShowSpotsManagement(true);
  };

  const toggleUserSelection = (userId: number) => {
    setFormData((prev) => ({
      ...prev,
      venue_admin_ids: prev.venue_admin_ids.includes(userId)
        ? prev.venue_admin_ids.filter((id) => id !== userId)
        : [...prev.venue_admin_ids, userId]
    }));
  };

  const filteredAdmins = venueAdmins.filter(admin => {
    const searchLower = searchTerm.toLowerCase();
    return (
      admin.firstName.toLowerCase().includes(searchLower) ||
      admin.lastName.toLowerCase().includes(searchLower) ||
      admin.email.toLowerCase().includes(searchLower)
    );
  });

  const handleClearAllAdmins = () => {
    setFormData(prev => ({
      ...prev,
      venue_admin_ids: []
    }));
  };

  const handleRemoveAdmin = (adminId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleUserSelection(adminId);
  };

  const getAdminNameById = (adminId: number) => {
    const admin = venueAdmins.find(a => a.id === adminId);
    return admin ? `${admin.firstName} ${admin.lastName}` : '';
  };

  const handleVenueImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Create preview URL immediately for both new and existing venues
      const previewUrl = URL.createObjectURL(file);
      setVenueImageUrl(previewUrl);
      setVenueImageFile(file);

      if (currentEditVenueId) {
        try {
          // Upload the file immediately for existing venues
          await dispatch(uploadVenueImage({
            venueId: currentEditVenueId,
            file
          })).unwrap();

          toast({
            title: "Success",
            description: "Venue image updated successfully",
          });
        } catch (error) {
          // If upload fails, clear the preview
          setVenueImageUrl("");
          setVenueImageFile(null);
          toast({
            title: "Error",
            description: error as string,
            variant: "destructive",
          });
        }
      }
    }
  };

  const handleSpotImageChange = async (e: React.ChangeEvent<HTMLInputElement>, spotId: number) => {
    const file = e.target.files?.[0];
    if (file) {
      // Create preview URL immediately
      const previewUrl = URL.createObjectURL(file);
      setSpotImages(prev => ({
        ...prev,
        [spotId]: { file, url: previewUrl }
      }));

      if (currentEditVenueId) {
        try {
          // Upload the file immediately for existing venues
          await dispatch(uploadSpotImage({
            venueId: currentEditVenueId,
            spotId,
            file
          })).unwrap();

          toast({
            title: "Success",
            description: "Spot image updated successfully",
          });
        } catch (error) {
          // If upload fails, clear the preview
          setSpotImages(prev => {
            const newState = { ...prev };
            delete newState[spotId];
            return newState;
          });
          toast({
            title: "Error",
            description: error as string,
            variant: "destructive",
          });
        }
      }
    }
  };

  const handleRemoveSpotImage = (spotId: number) => {
    setSpotImages(prev => {
      const newState = { ...prev };
      delete newState[spotId];
      return newState;
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{isEditMode ? 'Edit Venue' : 'Add New Venue'}</DialogTitle>
              <DialogDescription>
                Enter the details for the {isEditMode ? 'venue' : 'new venue'}. Required fields are marked with an asterisk (*).
              </DialogDescription>
            </DialogHeader>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">Basic Details</TabsTrigger>
                <TabsTrigger value="images">Images</TabsTrigger>
              </TabsList>

              <TabsContent value="details">
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="venue_name">
                      Venue Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="venue_name"
                      name="venue_name"
                      value={formData.venue_name}
                      onChange={handleChange}
                      placeholder="Enter venue name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="address">
                        Address <span className="text-red-500">*</span>
                      </Label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowMapDialog(true)}
                          className="flex items-center gap-1"
                        >
                          <MapPin size={16} />
                          Find on Map
                        </Button>
                        {locationCoordinates && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleShareLocation}
                            className="flex items-center gap-1"
                          >
                            <Copy size={16} />
                            Share Location
                          </Button>
                        )}
                      </div>
                    </div>
                    <Input
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="Street address"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Brief description of the venue"
                      className="min-h-24"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="venue_admin_ids">Assign Facility Managers</Label>
                    <Popover open={isAdminPopoverOpen} onOpenChange={setIsAdminPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button 
                          variant="outline" 
                          role="combobox" 
                          className="w-full justify-between"
                        >
                          <div className="flex items-center">
                            <Users className="mr-2 h-4 w-4" />
                            {formData.venue_admin_ids.length === 0 
                              ? "Select facility managers" 
                              : `${formData.venue_admin_ids.length} manager${formData.venue_admin_ids.length > 1 ? 's' : ''} selected`}
                          </div>
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent 
                        className="w-[300px] p-0" 
                        align="start"
                        sideOffset={8}
                      >
                        <Command>
                          <CommandInput 
                            placeholder="Search facility managers..." 
                            value={searchTerm}
                            onValueChange={setSearchTerm}
                            className="h-9"
                          />
                          <CommandList>
                            <CommandEmpty>No facility managers found</CommandEmpty>
                            <CommandGroup className="max-h-[200px] overflow-y-auto">
                              {filteredAdmins.map(admin => (
                                <CommandItem
                                  key={admin.id}
                                  onSelect={() => {
                                    toggleUserSelection(admin.id);
                                  }}
                                  className="flex items-center justify-between p-2 cursor-pointer"
                                >
                                  <div className="flex flex-col">
                                    <div className="font-medium">{admin.firstName} {admin.lastName}</div>
                                    <div className="text-xs text-gray-500">{admin.email}</div>
                                  </div>
                                  {formData.venue_admin_ids.includes(admin.id) && (
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

                  {formData.venue_admin_ids.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label>Selected Facility Managers</Label>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 px-2 text-xs"
                          onClick={handleClearAllAdmins}
                        >
                          Clear All
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {formData.venue_admin_ids.map(adminId => (
                          <div 
                            key={adminId} 
                            className="flex items-center bg-primary/10 text-primary rounded-full pl-3 pr-1 py-1"
                          >
                            <span className="text-sm">{getAdminNameById(adminId)}</span>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-5 w-5 p-0 ml-1 rounded-full hover:bg-primary/20"
                              onClick={(e) => handleRemoveAdmin(adminId, e)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {isEditMode && currentEditVenueId && (
                    <div className="mt-2">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-sm font-semibold">Venue Spots</h3>
                          <p className="text-xs text-gray-500">
                            This venue has {venues.find(v => v.venue_id === currentEditVenueId)?.venue_spots?.length || 0} spot(s)
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleManageSpots}
                        >
                          Manage Spot(s)
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="images">
                <div className="grid gap-6 py-4">
                  {/* Venue Image Upload */}
                  <div className="space-y-3">
                    <Label>Venue Image</Label>
                    <div className="flex flex-col gap-3">
                      {venueImageUrl ? (
                        <div className="relative">
                          <img 
                            src={venueImageUrl} 
                            alt="Venue" 
                            className="w-full h-40 object-cover rounded-md"
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            className="absolute top-2 right-2"
                            onClick={() => {
                              setVenueImageUrl("");
                              setVenueImageFile(null);
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center justify-center bg-gray-50">
                          <Image className="h-12 w-12 text-gray-400" />
                          <p className="mt-2 text-sm text-gray-600">Upload a venue image</p>
                          <p className="text-xs text-gray-400">PNG, JPG, GIF up to 10MB</p>
                          <div className="mt-4">
                            <Label htmlFor="venueImage" className="sr-only">Upload venue image</Label>
                            <Input
                              id="venueImage"
                              type="file"
                              accept="image/*"
                              className="block w-full text-sm text-gray-500
                              file:mr-4 file:py-2 file:px-4 file:rounded-md
                              file:border-0 file:text-sm file:font-semibold
                              file:bg-blue-50 file:text-blue-700
                              hover:file:bg-blue-100"
                              onChange={handleVenueImageChange}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Spot Images Upload */}
                  <div className="space-y-3">
                    <Label>Spot Images</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {currentEditVenueId && venues.find(v => v.venue_id === currentEditVenueId)?.venue_spots?.map((spot) => (
                        <div key={spot.venue_spot_id} className="border rounded-md p-4">
                          <h4 className="font-medium mb-2">{spot.spot_name}</h4>
                          {spotImages[spot.venue_spot_id]?.url ? (
                            <div className="relative">
                              <img 
                                src={spotImages[spot.venue_spot_id].url} 
                                alt={`Spot ${spot.spot_name}`} 
                                className="w-full h-32 object-cover rounded-md"
                              />
                              <Button
                                type="button"
                                size="sm"
                                variant="destructive"
                                className="absolute top-2 right-2"
                                onClick={() => handleRemoveSpotImage(spot.venue_spot_id)}
                              >
                                Remove
                              </Button>
                            </div>
                          ) : (
                            <div className="border-2 border-dashed border-gray-300 rounded-md p-4 flex flex-col items-center justify-center bg-gray-50">
                              <Camera className="h-8 w-8 text-gray-400" />
                              <p className="mt-1 text-xs text-gray-600">Add image for {spot.spot_name}</p>
                              <div className="mt-2 w-full">
                                <Label htmlFor={`spot-image-${spot.venue_spot_id}`} className="sr-only">Upload spot image</Label>
                                <Input
                                  id={`spot-image-${spot.venue_spot_id}`}
                                  type="file"
                                  accept="image/*"
                                  className="block w-full text-sm text-gray-500
                                  file:mr-2 file:py-1 file:px-2 file:rounded-md
                                  file:border-0 file:text-xs file:font-semibold
                                  file:bg-blue-50 file:text-blue-700
                                  hover:file:bg-blue-100"
                                  onChange={(e) => handleSpotImageChange(e, spot.venue_spot_id)}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                      {(!currentEditVenueId || !venues.find(v => v.venue_id === currentEditVenueId)?.venue_spots?.length) && (
                        <div className="col-span-2 text-center py-4 bg-gray-50 rounded-md">
                          <p className="text-sm text-gray-500">Add spots to the venue to upload spot images</p>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">Upload images for each spot in the venue.</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => handleDialogClose(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {isEditMode ? 'Update Venue' : 'Add Venue'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showMapDialog} onOpenChange={setShowMapDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Find Location on Map</DialogTitle>
            <DialogDescription>
              Click on the map to select a location for your venue.
            </DialogDescription>
          </DialogHeader>
          <div className="h-[300px] bg-gray-100 rounded-md flex items-center justify-center">
            <p className="text-gray-500 text-center">Map would be displayed here<br />Click anywhere to select location</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMapDialog(false)}>Cancel</Button>
            <Button onClick={handleFindOnMap}>Select Location</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddSpotsDialog} onOpenChange={setShowAddSpotsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Venue Updated Successfully' : 'Venue Added Successfully'}</DialogTitle>
            <DialogDescription>
              Your venue has been {isEditMode ? 'updated' : 'added'}. Would you like to {isEditMode ? 'edit' : 'add'} spots for this venue now?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAddSpotsDialog(false);
              handleDialogClose(false);
            }}>
              Later
            </Button>
            <Button onClick={handleAddSpots}>
              {isEditMode ? 'Edit Spots' : 'Add Spots'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showSpotsManagement && currentEditVenueId && (
        <AddVenueSpots
          open={showSpotsManagement}
          onOpenChange={setShowSpotsManagement}
          venueId={currentEditVenueId}
        />
      )}
    </>
  );
};

export default AddVenueDialog;
