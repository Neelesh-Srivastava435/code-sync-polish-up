<?php

namespace App\Http\Controllers\Partner;

use App\Http\Controllers\Controller;
use App\Models\Partner;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use App\Traits\LogsActivity;

class PartnerController extends Controller
{
    use LogsActivity;

    /**
     * Display a listing of the partners.
     */
    public function index(): JsonResponse
    {
        try {
            $query = Partner::query(); // Start building the query

            // Handle search
            if ($search = request()->query('search')) {
                $query->where(function($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%")
                      ->orWhere('mobile', 'like', "%{$search}%")
                      ->orWhere('specialization', 'like', "%{$search}%")
                      ->orWhere('status', 'like', "%{$search}%");
                });
            }

            // Eager load batches with specific columns
            $query->with('batches:id,name,status');

            // Handle field selection
            $fields = request()->query('fields');
            if ($fields) {
                $fieldsArray = explode(',', $fields);
                if (!in_array('id', $fieldsArray) && count($fieldsArray) > 0) {
                    array_unshift($fieldsArray, 'id');
                }
                $query->select($fieldsArray);
            }

            // Apply pagination
            $perPage = request()->query('per_page', 10);
            $partners = $query->orderBy('created_at', 'desc')
                             ->paginate($perPage);

            return response()->json($partners);
        } catch (\Exception $e) {
            Log::error('Failed to fetch partners', ['error' => $e->getMessage()]);

            return response()->json([
                'message' => 'Something went wrong while retrieving partners',
            ], 500);
        }
    }

    /**
     * Store a newly created partner in storage.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'specialization' => 'nullable|string|max:255',
                'email' => 'required|email|unique:partners,email',
                'mobile' => 'required|string|max:20|unique:partners,mobile',
                'status' => 'required|in:Active,Inactive',
                'pay_type' => 'required|in:Fixed,Revenue Share', // Changed payType to pay_type
                'pay_amount' => 'nullable|numeric',
                'pay_percentage' => 'nullable|numeric',
                'payment_terms' => 'required|string|max:255',
                'tds_percentage' => 'nullable|numeric|min:0|max:100',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $partner = Partner::create($request->all());

            $this->logPartnerAction('Partner Created', $partner, "Partner \"{$partner->name}\" was created", null, $partner->toArray());

            return response()->json([
                'message' => 'Partner created successfully',
                'data' => $partner,
            ], 201);
        } catch (\Exception $e) {
            Log::error('Failed to create partner', ['error' => $e->getMessage()]);

            return response()->json([
                'message' => 'Something went wrong while creating the partner',
            ], 500);
        }
    }

    /**
     * Display the specified partner.
     */
    public function show(Partner $partner): JsonResponse
    {
        try {
            return response()->json([
                'message' => 'Partner retrieved successfully',
                'data' => $partner,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch partner', ['error' => $e->getMessage()]);

            return response()->json([
                'message' => 'Something went wrong while retrieving the partner',
            ], 500);
        }
    }

    public function update(Request $request, Partner $partner): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|required|string|max:255',
                'specialization' => 'sometimes|nullable|string|max:255',
                'email' => [
                    'sometimes', 'required', 'email',
                    Rule::unique('partners', 'email')->ignore($partner->id),
                ],
                'mobile' => [
                    'sometimes', 'required', 'string', 'max:20',
                    Rule::unique('partners', 'mobile')->ignore($partner->id),
                ],
                'status' => 'sometimes|required|in:Active,Inactive',
                'pay_type' => 'sometimes|required|in:Fixed,Revenue Share',
                'pay_amount' => 'nullable|numeric',
                'pay_percentage' => 'nullable|numeric',
                'payment_terms' => 'sometimes|required|string|max:255',
                'tds_percentage' => 'sometimes|nullable|numeric|min:0|max:100',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $original = $partner->getOriginal();
            $partner->update($request->all());
            $changed = $partner->getChanges();

            $excludeFields = ['updated_at', 'created_at'];
            $oldValues = [];
            $newValues = [];
            $logMessages = [];

            foreach ($changed as $key => $newValue) {
                if (in_array($key, $excludeFields)) {
                    continue;
                }

                $old = $original[$key] ?? null;

                // Track values for logging
                $oldValues[$key] = $old;
                $newValues[$key] = $newValue;

                // Format change message
                $logMessages[] = "Updated {$key} from \"{$old}\" to \"{$newValue}\"";
            }

            $details = count($logMessages) > 0
                ? implode(', ', $logMessages)
                : 'No significant fields were changed';

            if (!empty($oldValues)) {
                $this->logPartnerAction(
                    'Partner Updated',
                    $partner,
                    $details,
                    $oldValues,
                    $newValues
                );
            }

            return response()->json([
                'message' => 'Partner updated successfully',
                'data' => $partner,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to update partner', ['error' => $e->getMessage()]);

            return response()->json([
                'message' => 'Something went wrong while updating the partner',
            ], 500);
        }
    }


    /**
     * Remove the specified partner from storage.
     */
    public function destroy(Partner $partner): JsonResponse
    {
        try {

            $partnerData = $partner->toArray();
            // 🔥 Detach from batches (batch_partner pivot table)
            $partner->batches()->detach(); 

            // Now delete the partner
            $partner->delete();

            $this->logPartnerAction(
                'Partner Deleted',
                $partner, // Pass the partner model, it still holds the ID after soft delete or before hard delete
                "Partner \"{$partner->name}\" was deleted", // Use double quotes and the stored name
                $partnerData,
                null
            );

            return response()->json([
                'message' => 'Partner deleted successfully',
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to delete partner', ['error' => $e->getMessage()]);

            return response()->json([
                'message' => 'Something went wrong while deleting the partner',
            ], 500);
        }
    }

}