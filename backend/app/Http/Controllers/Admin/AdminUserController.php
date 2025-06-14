<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminUser;
use App\Models\UserPermission;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class AdminUserController extends Controller
{
    private function checkPermission($module, $action)
    {
        $user = Auth::user();
        
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $userPermission = $user->permission;
        
        if (!$userPermission || !$userPermission->permissions) {
            return response()->json(['message' => 'No permissions assigned'], 403);
        }

        $permissions = $userPermission->permissions;
        
        if (!isset($permissions[$module]) || !isset($permissions[$module][$action]) || !$permissions[$module][$action]) {
            return response()->json([
                'message' => "You don't have permission to {$action} {$module}",
                'required_permission' => "{$module}.{$action}"
            ], 403);
        }

        return null; // Permission granted
    }

    public function index()
    {
        $permissionCheck = $this->checkPermission('users', 'view');
        if ($permissionCheck) return $permissionCheck;

        try {
            $users = AdminUser::with(['role', 'permission'])->get();
            
            $formattedUsers = $users->map(function ($user) {
                return [
                    'id' => $user->id,
                    'firstName' => $user->first_name,
                    'lastName' => $user->last_name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'address' => $user->address,
                    'role' => $user->role ? $user->role->name : 'No Role',
                    'permissions' => $user->permission ? $user->permission->permissions : [],
                    'status' => ucfirst($user->status),
                    'dateOfBirth' => $user->date_of_birth,
                    'employeeCode' => $user->employee_code,
                    'joiningDate' => $user->joining_date,
                    'alternateContact' => $user->alternate_contact,
                    'profileImage' => $user->profile_image,
                    'documents' => $user->documents,
                ];
            });

            return response()->json([
                'success' => true,
                'users' => $formattedUsers
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching users: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch users'
            ], 500);
        }
    }

    public function store(Request $request)
    {
        $permissionCheck = $this->checkPermission('users', 'create');
        if ($permissionCheck) return $permissionCheck;

        try {
            $validatedData = $request->validate([
                'data' => 'required|json',
                'profileImage' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048', // 2MB Max
                'documents.*' => 'nullable|file|mimes:pdf,doc,docx,xls,xlsx,jpeg,png,jpg|max:15360', // 15MB Max
            ]);
        
            $data = json_decode($validatedData['data'], true);
        
            $request->validate([
                'first_name' => 'required|string|max:255',
                'last_name' => 'required|string|max:255',
                'email' => 'required|string|email|max:255|unique:admin_users',
                'phone' => 'required|string|max:20',
                'role' => 'required|string',
                'status' => 'required|in:active,inactive,pending',
                'date_of_birth' => 'nullable|date',
                'employee_code' => 'nullable|string|max:255',
                'joining_date' => 'nullable|date',
                'alternate_contact' => 'nullable|string|max:20',
                'address' => 'required|string',
                'permissions' => 'required|array',
            ]);
        
            $role = Role::where('name', $data['role'])->first();
            if (!$role) {
                return response()->json(['message' => 'Role not found'], 400);
            }
        
            $adminUser = AdminUser::create([
                'first_name' => $data['first_name'],
                'last_name' => $data['last_name'],
                'email' => $data['email'],
                'phone' => $data['phone'],
                'role_id' => $role->id,
                'status' => $data['status'],
                'date_of_birth' => $data['date_of_birth'],
                'employee_code' => $data['employee_code'],
                'joining_date' => $data['joining_date'],
                'alternate_contact' => $data['alternate_contact'],
                'address' => $data['address'],
                'password' => Hash::make('password'), // Default password
                'created_by' => Auth::id(),
                'updated_by' => Auth::id(),
            ]);
        
            // Handle profile image upload
            if ($request->hasFile('profileImage')) {
                $imagePath = $request->file('profileImage')->store('profile_images', 'lovable');
                $adminUser->profile_image = $imagePath;
                $adminUser->save();
            }
        
            // Handle documents upload
            if ($request->hasFile('documents')) {
                $documentPaths = [];
                foreach ($request->file('documents') as $document) {
                    $path = $document->store('documents', 'lovable');
                    $documentPaths[] = $path;
                }
                $adminUser->documents = $documentPaths;
                $adminUser->save();
            }
        
            // Create user permissions
            UserPermission::create([
                'user_id' => $adminUser->id,
                'permissions' => $data['permissions'],
                'created_by' => Auth::id(),
                'updated_by' => Auth::id(),
            ]);
        
            return response()->json([
                'success' => true,
                'message' => 'Admin user created successfully',
                'user' => $adminUser
            ], 201);
        
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error creating admin user: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to create admin user',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show($id)
    {
        $permissionCheck = $this->checkPermission('users', 'view');
        if ($permissionCheck) return $permissionCheck;

        try {
            $user = AdminUser::with(['role', 'permission'])->findOrFail($id);

            return response()->json([
                'success' => true,
                'user' => [
                    'id' => $user->id,
                    'firstName' => $user->first_name,
                    'lastName' => $user->last_name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'address' => $user->address,
                    'role' => $user->role ? $user->role->name : 'No Role',
                    'permissions' => $user->permission ? $user->permission->permissions : [],
                    'status' => ucfirst($user->status),
                    'dateOfBirth' => $user->date_of_birth,
                    'employeeCode' => $user->employee_code,
                    'joiningDate' => $user->joining_date,
                    'alternateContact' => $user->alternate_contact,
                    'profileImage' => $user->profile_image,
                    'documents' => $user->documents,
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching user: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch user'
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $permissionCheck = $this->checkPermission('users', 'edit');
        if ($permissionCheck) return $permissionCheck;

        try {
            $validatedData = $request->validate([
                'data' => 'required|json',
                'profileImage' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048', // 2MB Max
                'documents.*' => 'nullable|file|mimes:pdf,doc,docx,xls,xlsx,jpeg,png,jpg|max:15360', // 15MB Max
            ]);
        
            $data = json_decode($validatedData['data'], true);
        
            $request->validate([
                'first_name' => 'required|string|max:255',
                'last_name' => 'required|string|max:255',
                'email' => 'required|string|email|max:255|unique:admin_users,email,'.$id,
                'phone' => 'required|string|max:20',
                'role' => 'required|string',
                'status' => 'required|in:active,inactive,pending',
                'date_of_birth' => 'nullable|date',
                'employee_code' => 'nullable|string|max:255',
                'joining_date' => 'nullable|date',
                'alternate_contact' => 'nullable|string|max:20',
                'address' => 'required|string',
                'permissions' => 'required|array',
            ]);
        
            $adminUser = AdminUser::findOrFail($id);
        
            $role = Role::where('name', $data['role'])->first();
            if (!$role) {
                return response()->json(['message' => 'Role not found'], 400);
            }
        
            $adminUser->update([
                'first_name' => $data['first_name'],
                'last_name' => $data['last_name'],
                'email' => $data['email'],
                'phone' => $data['phone'],
                'role_id' => $role->id,
                'status' => $data['status'],
                'date_of_birth' => $data['date_of_birth'],
                'employee_code' => $data['employee_code'],
                'joining_date' => $data['joining_date'],
                'alternate_contact' => $data['alternate_contact'],
                'address' => $data['address'],
                'updated_by' => Auth::id(),
            ]);
        
            // Handle profile image upload
            if ($request->hasFile('profileImage')) {
                // Delete the old image if it exists
                if ($adminUser->profile_image) {
                    Storage::disk('lovable')->delete($adminUser->profile_image);
                }
        
                $imagePath = $request->file('profileImage')->store('profile_images', 'lovable');
                $adminUser->profile_image = $imagePath;
                $adminUser->save();
            }
        
            // Handle documents upload
            if ($request->hasFile('documents')) {
                // Delete the old documents if they exist
                if ($adminUser->documents) {
                    foreach ($adminUser->documents as $document) {
                        Storage::disk('lovable')->delete($document);
                    }
                }
        
                $documentPaths = [];
                foreach ($request->file('documents') as $document) {
                    $path = $document->store('documents', 'lovable');
                    $documentPaths[] = $path;
                }
                $adminUser->documents = $documentPaths;
                $adminUser->save();
            }
        
            // Update user permissions
            UserPermission::updateOrCreate(
                ['user_id' => $adminUser->id],
                [
                    'permissions' => $data['permissions'],
                    'updated_by' => Auth::id(),
                ]
            );
        
            return response()->json([
                'success' => true,
                'message' => 'Admin user updated successfully',
                'user' => $adminUser
            ], 200);
        
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error updating admin user: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update admin user',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy($id)
    {
        $permissionCheck = $this->checkPermission('users', 'delete');
        if ($permissionCheck) return $permissionCheck;

        try {
            $adminUser = AdminUser::findOrFail($id);
        
            // Delete profile image if it exists
            if ($adminUser->profile_image) {
                Storage::disk('lovable')->delete($adminUser->profile_image);
            }
        
            // Delete documents if they exist
            if ($adminUser->documents) {
                foreach ($adminUser->documents as $document) {
                    Storage::disk('lovable')->delete($document);
                }
            }
        
            // Delete user permissions
            UserPermission::where('user_id', $adminUser->id)->delete();
        
            // Delete the user
            $adminUser->delete();
        
            return response()->json([
                'success' => true,
                'message' => 'Admin user deleted successfully'
            ], 200);
        
        } catch (\Exception $e) {
            Log::error('Error deleting admin user: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete admin user'
            ], 500);
        }
    }

    public function toggleStatus($id)
    {
        $permissionCheck = $this->checkPermission('users', 'delete');
        if ($permissionCheck) return $permissionCheck;

        try {
            $adminUser = AdminUser::findOrFail($id);

            $adminUser->status = ($adminUser->status === 'active') ? 'inactive' : 'active';
            $adminUser->updated_by = Auth::id();
            $adminUser->save();

            return response()->json([
                'success' => true,
                'message' => 'Admin user status toggled successfully',
                'status' => $adminUser->status
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error toggling admin user status: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to toggle admin user status'
            ], 500);
        }
    }

    public function indexByPermission(Request $request)
    {
        try {
            // Validate the request
            $request->validate([
                'permission' => 'required|string',
            ]);
    
            $permission = $request->input('permission');
    
            // Fetch users who have the specified permission
            $users = AdminUser::whereHas('permission', function ($query) use ($permission) {
                $query->whereJsonContains('permissions', [$permission => ['view' => true]]);
            })->with(['role', 'permission'])->get();
    
            // Format the users
            $formattedUsers = $users->map(function ($user) {
                return [
                    'id' => $user->id,
                    'firstName' => $user->first_name,
                    'lastName' => $user->last_name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'address' => $user->address,
                    'role' => $user->role ? $user->role->name : 'No Role',
                    'permissions' => $user->permission ? $user->permission->permissions : [],
                    'status' => ucfirst($user->status),
                    'dateOfBirth' => $user->date_of_birth,
                    'employeeCode' => $user->employee_code,
                    'joiningDate' => $user->joining_date,
                    'alternateContact' => $user->alternate_contact,
                    'profileImage' => $user->profile_image,
                    'documents' => $user->documents,
                ];
            });
    
            return response()->json([
                'success' => true,
                'users' => $formattedUsers
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching users by permission: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch users by permission'
            ], 500);
        }
    }

    public function updateAuthenticatedUserProfile(Request $request)
    {
        try {
            $user = Auth::user();
    
            if (!$user) {
                return response()->json(['message' => 'Unauthorized'], 401);
            }
    
            $validatedData = $request->validate([
                'first_name' => 'required|string|max:255',
                'last_name' => 'required|string|max:255',
                'phone' => 'required|string|max:20',
                'date_of_birth' => 'nullable|date',
                'alternate_contact' => 'nullable|string|max:20',
                'address' => 'required|string',
            ]);
    
            $user->update([
                'first_name' => $validatedData['first_name'],
                'last_name' => $validatedData['last_name'],
                'phone' => $validatedData['phone'],
                'date_of_birth' => $validatedData['date_of_birth'],
                'alternate_contact' => $validatedData['alternate_contact'],
                'address' => $validatedData['address'],
                'updated_by' => $user->id,
            ]);
    
            return response()->json([
                'success' => true,
                'message' => 'User profile updated successfully',
                'user' => $user
            ], 200);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error updating user profile: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update user profile'
            ], 500);
        }
    }
}
