import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '@/api/axios'; // Assuming you have your axios instance

// Define the Program interface
export interface Program {
  id: number; // Assuming your backend uses numeric IDs
  name: string;
  description: string;
}

// Define the state interface
interface ProgramState {
  programs: Program[];
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: ProgramState = {
  programs: [],
  loading: false,
  error: null,
};

// Async thunks for CRUD operations
export const fetchPrograms = createAsyncThunk(
  'programs/fetchPrograms',
  async () => {
    const response = await api.get('/admin/programs'); // Adjust your API endpoint
    return response.data.data as Program[]; // Assuming your API returns data in this structure
  }
);

export const addProgram = createAsyncThunk(
  'programs/addProgram',
  async (program: Omit<Program, 'id'>) => {
    const response = await api.post('/admin/programs', program);
    return response.data.data as Program;
  }
);

export const updateProgram = createAsyncThunk(
  'programs/updateProgram',
  async (program: Program) => {
    const response = await api.put(`/admin/programs/${program.id}`, program);
    return response.data.data as Program;
  }
);

export const deleteProgram = createAsyncThunk(
  'programs/deleteProgram',
  async (id: number) => {
    await api.delete(`/admin/programs/${id}`);
    return id; // Return the ID of the deleted program
  }
);

// Create the slice
const programSlice = createSlice({
  name: 'programs',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPrograms.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPrograms.fulfilled, (state, action: PayloadAction<Program[]>) => {
        state.loading = false;
        state.programs = action.payload;
      })
      .addCase(fetchPrograms.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch programs';
      })
      .addCase(addProgram.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addProgram.fulfilled, (state, action: PayloadAction<Program>) => {
        state.loading = false;
        state.programs.push(action.payload);
      })
      .addCase(addProgram.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to add program';
      })
      .addCase(updateProgram.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProgram.fulfilled, (state, action: PayloadAction<Program>) => {
        state.loading = false;
        state.programs = state.programs.map((program) =>
          program.id === action.payload.id ? action.payload : program
        );
      })
      .addCase(updateProgram.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update program';
      })
      .addCase(deleteProgram.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteProgram.fulfilled, (state, action: PayloadAction<number>) => {
        state.loading = false;
        state.programs = state.programs.filter((program) => program.id !== action.payload);
      })
      .addCase(deleteProgram.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to delete program';
      });
  },
});

export default programSlice.reducer;
