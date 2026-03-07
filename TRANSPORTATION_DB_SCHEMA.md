# Transportation Database Structure

## 1. `transport_vehicles`
Stores each vehicle listing.

**Fields:**
- `id` (string): Unique identifier
- `name` (string): Vehicle name (e.g., "Honda City", "Mountain Bike")
- `type` (string): Type of vehicle (`cycle`, `ebicycle`, `bike`, `car`, `traveller`)
- `city` (string): Operating city
- `state` (string): Operating state
- `country` (string): Operating country
- `pricePerDay` (number): Daily rental price
- `pricePerHour` (number): Hourly rental price
- `seats` (number): Seating capacity
- `description` (string): Detailed description
- `features` (array of strings): Features (e.g., ["AC", "Bluetooth", "Power Steering"])
- `images` (array of strings): URLs to vehicle images
- `isActive` (boolean): Whether the vehicle is active for booking
- `isVisible` (boolean): Whether the vehicle is visible on the frontend
- `driverIncluded` (boolean): Does the price include a driver?
- `fuelIncluded` (boolean): Does the price include fuel?
- `rating` (number): Average user rating
- `totalBookings` (number): Total number of times booked
- `createdAt` (timestamp): Record creation time
- `updatedAt` (timestamp): Record last update time

## 2. `transport_cities`
Stores which cities are active for transport.

**Fields:**
- `id` (string): Unique identifier
- `cityName` (string): Name of the city
- `stateName` (string): Name of the state
- `countryName` (string): Name of the country
- `isActive` (boolean): Whether transport services are currently active here
- `vehicleTypes` (array of strings): Types of vehicles available (`cycle`, `car`, etc.)
- `createdAt` (timestamp): Record creation time

## 3. `transport_bookings`
Stores all transportation bookings.

**Fields:**
- `id` (string): Unique identifier
- `userId` (string): ID of the user who made the booking
- `vehicleId` (string): ID of the booked vehicle
- `vehicleName` (string): Name of the booked vehicle
- `vehicleType` (string): Type of the vehicle
- `pickupCity` (string): City of pickup
- `pickupAddress` (string): Exact pickup address
- `dropCity` (string): City of drop-off (if different or one-way)
- `dropAddress` (string): Exact drop-off address
- `startDate` (timestamp): Booking start time
- `endDate` (timestamp): Booking end time
- `totalDays` (number): Duration in days
- `totalHours` (number): Duration in hours
- `totalAmount` (number): Total cost of the booking
- `status` (string): Status (`pending`, `confirmed`, `cancelled`, `completed`)
- `passengerName` (string): Name of the primary passenger
- `passengerPhone` (string): Contact number
- `specialRequests` (string): Any special requests from the user
- `createdAt` (timestamp): Record creation time
- `updatedAt` (timestamp): Record last update time

## 4. `transport_settings`
Global settings for the transportation module.

**Fields:**
- `isTransportEnabled` (boolean): Master switch to enable/disable the transport feature
- `maintenanceMode` (boolean): Whether the system is under maintenance
- `bookingAdvanceDays` (number): How many days in advance a booking can be made
- `cancellationHours` (number): Minimum hours before start time for free cancellation

---

# Firestore Security Rules

Here are the complete security rules you can add to your `firestore.rules` inside the `match /databases/{database}/documents` block:

```javascript
    // Helper function for Admin access
    function isAdmin() {
      return request.auth != null && (request.auth.token.role == 'admin' || request.auth.token.email == 'chauhanparth165@gmail.com');
    }

    match /transport_vehicles/{vehicleId} {
      // Users can read active and visible vehicles. Admin has full read/write.
      allow read: if isAdmin() || (resource.data.isActive == true && resource.data.isVisible == true);
      allow write: if isAdmin();
    }

    match /transport_cities/{cityId} {
      // Users can read active cities. Admin has full read/write.
      allow read: if isAdmin() || resource.data.isActive == true;
      allow write: if isAdmin();
    }

    match /transport_bookings/{bookingId} {
      // Users can create bookings and read their own bookings. Admin has full read/write.
      allow read: if isAdmin() || (request.auth != null && resource.data.userId == request.auth.uid);
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update, delete: if isAdmin();
    }

    match /transport_settings/{settingId} {
      // Anyone can read (needed for frontend logic like isTransportEnabled). Admin has full write.
      allow read: if true;
      allow write: if isAdmin();
    }
```
