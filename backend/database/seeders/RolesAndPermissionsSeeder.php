<?php

namespace Database\Seeders;

use App\Models\AdminUser;
use App\Models\Role;
use App\Models\Partner;
use App\Models\Member;
use App\Models\UserPermission;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        // Create roles
        $adminRole = Role::firstOrCreate([
            'name' => 'Admin',
            'description' => 'Administrator with full access'
        ]);
        $accountManagerRole = Role::firstOrCreate([
            'name' => 'Account Manager',
            'description' => 'Manages accounts'
        ]);
        $facilityManagerRole = Role::firstOrCreate([
            'name' => 'Facility Manager',
            'description' => 'Manages facilities'
        ]);

        // Create an initial AdminUser and assign the account manager role
        $adminUser = AdminUser::firstOrCreate([
            'first_name' => 'Super',
            'last_name' => 'Admin',
            'email' => 'admin@admin.com',
            'password' => bcrypt('password'),
            'employee_code' => 'ADM001',
            'role_id' => $adminRole->id,
            'phone' => '+919696858576',
            'status' => 'active',
            'date_of_birth' => Carbon::create(1990, 1, 1),
            'alternate_contact' => '+919696858576',
            'address' => '123 Admin St, Anytown, USA',
        ]);

        UserPermission::updateOrCreate(
            ['user_id' => $adminUser->id],
            [
                'permissions' => $this->generateRandomPermissions(),
                'created_by' => null,
                'updated_by' => null
            ]
        );

        // Create a account manager
        $accountManager = AdminUser::firstOrCreate([
            'first_name' => 'John',
            'last_name' => 'Doe',
            'email' => 'accountmanager@example.com',
            'password' => bcrypt('password'),
            'employee_code' => 'ACC001',
            'role_id' => $accountManagerRole->id,
            'phone' => '+919696858576',
            'status' => 'active',
            'date_of_birth' => Carbon::create(1990, 1, 1),
            'alternate_contact' => '+919696858576',
            'address' => '123 Main St, Anytown, USA',
        ]);

        UserPermission::updateOrCreate(
            ['user_id' => $accountManager->id],
            [
                'permissions' => $this->generateRandomPermissions(),
                'created_by' => null,
                'updated_by' => null
            ]
        );

        // Create a finance manager
        // Create a Facility Manager
        $facilityManager = AdminUser::firstOrCreate([
            'first_name' => 'Mr. Bean',
            'email' => 'facilitymanager@example.com',
            'password' => bcrypt('password'),
            'employee_code' => 'FAC001',
            'role_id' => $facilityManagerRole->id,
            'phone' => '+1 (555) 234-5678',
            'status' => 'pending',
            'date_of_birth' => Carbon::create(1985, 5, 10),
            'alternate_contact' => '+1 (555) 345-6789',
            'address' => '456 Oak Ave, Springfield, USA',
        ]);

        UserPermission::updateOrCreate(
            ['user_id' => $facilityManager->id],
            [
                'permissions' => $this->generateRandomPermissions(),
                'created_by' => null,
                'updated_by' => null
            ]
        );

    }

    private function generateRandomPermissions(): array
    {
        $modules = ['users', 'venues', 'batches', 'reports'];
        $actions = ['view', 'create', 'edit', 'delete'];
        $permissions = [];

        foreach ($modules as $module) {
            $permissions[$module] = [];
            foreach ($actions as $action) {
                $permissions[$module][$action] = (bool) rand(0, 1);
            }
        }

        return $permissions;
    }
}
