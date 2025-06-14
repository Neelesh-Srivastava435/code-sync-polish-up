import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { Venue, VenueSpot } from '../../pages/VenueManagement';
import api from '@/api/axios';

interface VenueState {
  venues: Venue[];
  selectedVenue: Venue | null;
  loading: boolean;
  error: string | null;
}
const initialState: VenueState = {
  venues: [],
  selectedVenue: null,
  loading: false,
  error: null,
};

// Payload types
type CreateVenuePayload = Omit<
  Venue,
  'venue_id' | 'status' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'peak_occupancy' | 'total_events' | 'revenue_generated'
> & {
  venue_admin_ids?: number[]; // Add venue_admin_ids
};

type UpdateVenuePayload = Omit<Venue, 'peak_occupancy' | 'total_events' | 'revenue_generated'> & {
  venue_admin_ids?: number[]; // Add venue_admin_ids
};
type UpdateSpotPayload = Omit<VenueSpot, 'venue_spot_id' | 'created_by' | 'updated_by'> & {
    venue_spot_id?: number;
    venue_id: number;
};

// Async Thunk: Fetch Venues
export const fetchVenues = createAsyncThunk<Venue[], void, { rejectValue: string }>(
  'venues/fetchVenues',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/venues');
      const venues = response.data.data.filter((venue: Venue) => venue.status !== 'deleted');

      return venues as Venue[];
    } catch (error: any) {
      console.error('Error fetching venues:', error);
      return rejectWithValue(error?.response?.data?.message || 'Failed to fetch venues');
    }
  }
);

// Async Thunk: Add Venue
export const addVenue = createAsyncThunk<Venue, CreateVenuePayload, { rejectValue: string }>(
  'venues/addVenue',
  async (venueData, { rejectWithValue }) => {
    try {
      const response = await api.post('/admin/venues', venueData);
      return response.data.data as Venue;
    } catch (error: any) {
      return rejectWithValue(error?.response?.data?.message || 'Failed to add venue');
    }
  }
);

// Async Thunk: Update Venue
export const updateVenue = createAsyncThunk<Venue, UpdateVenuePayload, { rejectValue: string }>(
  'venues/updateVenue',
  async (venueData, { rejectWithValue }) => {
    try {
      const response = await api.put(`/admin/venues/${venueData.venue_id}`, venueData);
      return response.data.data as Venue;
    } catch (error: any) {
      return rejectWithValue(error?.response?.data?.message || 'Failed to update venue');
    }
  }
);

// Async Thunk: Update Spot
export const updateSpot = createAsyncThunk<Venue, UpdateSpotPayload, { rejectValue: string }>(
    'venues/updateSpot',
    async (spotData, { rejectWithValue }) => {
        try {
            const response = await api.patch(`/admin/venues/${spotData.venue_id}/spots/${spotData.venue_spot_id}`, spotData);
            return response.data.data as Venue;
        } catch (error: any) {
            return rejectWithValue(error?.response?.data?.message || 'Failed to update spot');
        }
    }
);

// Async Thunk: Add Spot
// Async Thunk: Add Spot
export const addSpot = createAsyncThunk<Venue, UpdateSpotPayload, { rejectValue: string }>(
  'venues/addSpot',
  async (spotData, { rejectWithValue }) => {
      try {
          const response = await api.post(`/admin/venues/${spotData.venue_id}/spots`, spotData);
          return response.data.data as Venue;
      } catch (error: any) {
          return rejectWithValue(error?.response?.data?.message || 'Failed to add spot');
      }
  }
);


// Async Thunk: Delete Spot
export const deleteSpot = createAsyncThunk< { venueId: number, spotId: number }, { venueId: number, spotId: number }, { rejectValue: string }>(
    'venues/deleteSpot',
    async ({ venueId, spotId }, { rejectWithValue }) => {
        try {
            await api.delete(`/admin/venues/${venueId}/spots/${spotId}`);
            return { venueId, spotId }; // Return the venueId and spotId
        } catch (error: any) {
            return rejectWithValue(error?.response?.data?.message || 'Failed to delete spot');
        }
    }
);

// Async Thunk: Delete Venue
export const deleteVenue = createAsyncThunk<number, number, { rejectValue: string }>(
  'venues/deleteVenue',
  async (venueId, { rejectWithValue }) => {
    try {
      await api.delete(`/admin/venues/${venueId}`);
      return venueId;
    } catch (error: any) {
      return rejectWithValue(error?.response?.data?.message || 'Failed to delete venue');
    }
  }
);

// Upload venue image
export const uploadVenueImage = createAsyncThunk<
  string,
  { venueId: number; file: File },
  { rejectValue: string }
>(
  'venues/uploadVenueImage',
  async ({ venueId, file }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('venue_image', file);
      formData.append('venue_id', venueId.toString());

      const response = await api.post('/admin/venues/upload-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data.venue_image;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to upload venue image');
    }
  }
);

// Upload spot image
export const uploadSpotImage = createAsyncThunk<
  string,
  { venueId: number; spotId: number; file: File },
  { rejectValue: string }
>(
  'venues/uploadSpotImage',
  async ({ venueId, spotId, file }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('spot_image', file);
      formData.append('venue_id', venueId.toString());
      formData.append('spot_id', spotId.toString());

      const response = await api.post('/admin/venues/upload-spot-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data.spot_image;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to upload spot image');
    }
  }
);

const venueSlice = createSlice({
  name: 'venues',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchVenues.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVenues.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.length)
          state.venues = action.payload;
      })
      .addCase(fetchVenues.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Error fetching venues';
      })

      // Add
      .addCase(addVenue.fulfilled, (state, action) => {
        state.venues.unshift(action.payload);
      })
      .addCase(addVenue.rejected, (state, action) => {
        state.error = action.payload || 'Error adding venue';
      })

      // Update
      .addCase(updateVenue.fulfilled, (state, action) => {
        const index = state.venues.findIndex(v => v.venue_id === action.payload.venue_id);
        if (index !== -1) {
          state.venues[index] = {...state.venues[index], ...action.payload};
        }
      })
      .addCase(updateVenue.rejected, (state, action) => {
        state.error = action.payload || 'Error updating venue';
      })
      // Update Spot
      .addCase(updateSpot.fulfilled, (state, action) => {
        const venueIndex = state.venues.findIndex(v => v.venue_id === action.payload.venue_id);
        if (venueIndex !== -1) {
          state.venues[venueIndex] = action.payload;
        }
      })
      .addCase(updateSpot.rejected, (state, action) => {
        state.error = action.payload || 'Error updating spot';
      })
      // Add Spot
      .addCase(addSpot.fulfilled, (state, action) => {
        const venueIndex = state.venues.findIndex(v => v.venue_id === action.payload.venue_id);
        if (venueIndex !== -1) {
          state.venues[venueIndex] = action.payload;
        }
      })
      .addCase(addSpot.rejected, (state, action) => {
        state.error = action.payload || 'Error adding spot';
      })
      // Delete Spot
      .addCase(deleteSpot.fulfilled, (state, action) => {
        const { venueId, spotId } = action.payload || {};
        const venueIndex = state.venues.findIndex(v => v.venue_id === venueId);
        if (venueIndex !== -1) {
          state.venues[venueIndex].venue_spots = state.venues[venueIndex].venue_spots.filter(spot => spot.venue_spot_id !== spotId);
        }
      })
      .addCase(deleteSpot.rejected, (state, action) => {
        state.error = action.payload || 'Error deleting spot';
      })

      // Delete
      .addCase(deleteVenue.fulfilled, (state, action) => {
        state.venues = state.venues.filter(v => v.venue_id !== action.payload);
      })
      .addCase(deleteVenue.rejected, (state, action) => {
        state.error = action.payload || 'Error deleting venue';
      })

      // Upload Venue Image
      .addCase(uploadVenueImage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadVenueImage.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        if (state.selectedVenue) {
          state.selectedVenue.venue_image = action.payload;
        }
        const venue = state.venues.find(v => v.venue_id === state.selectedVenue?.venue_id);
        if (venue) {
          venue.venue_image = action.payload;
        }
      })
      .addCase(uploadVenueImage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to upload venue image';
      })

      // Upload Spot Image
      .addCase(uploadSpotImage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadSpotImage.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        // Update spot image in the venues array
        if (state.selectedVenue) {
          const spot = state.selectedVenue.venue_spots?.find(s => s.venue_spot_id === action.meta.arg.spotId);
          if (spot) {
            spot.spot_image = action.payload;
          }
        }
      })
      .addCase(uploadSpotImage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to upload spot image';
      });
  },
});

export const { clearError } = venueSlice.actions;

export default venueSlice.reducer;
