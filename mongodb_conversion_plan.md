# MongoDB Conversion Plan

This document outlines the systematic plan to convert the Charity Booking and ERP `new-backend` application from **MySQL + Sequelize** to **MongoDB + Mongoose**.

## 1. Architectural Strategy

MongoDB is a document-oriented database. Unlike MySQL's normalized relational tables, MongoDB works best with **denormalized, document-driven designs**. We will leverage MongoDB's powerful nested/embedded document model to simplify querying, improve performance, and keep data coherent.

### Schema Consolidation Map
```mermaid
graph TD
    subgraph MySQL (Relational)
        C[customer_master] -->|1:1| CL[customer_login]
        C -->|1:1| CI[customer_info]
        C -->|1:N| SA[shipping_address]
        O[order] -->|1:N| OD[order_details]
        QB[qurbani_booking] -->|1:N| QS[qurbani_share]
    end

    subgraph MongoDB (Document)
        MC[Customer Collection]
        MC -.->|Embeds| CL_Schema[Login Info]
        MC -.->|Embeds| CI_Schema[Profile Sync]
        MC -.->|Embeds| SA_Array[Addresses]
        
        MO[Order Collection]
        MO -.->|Embeds| OD_Array[Order Items]
        
        MQB[QurbaniBooking Collection]
        MQB -.->|Embeds| QS_Array[Booking Shares]
    end
```

---

## 2. Step-by-Step Transition Plan

### Phase 1: Dependency Setup
1. **Uninstall SQL packages**: Remove `mysql2` and `sequelize` from `package.json`.
2. **Install MongoDB packages**: Install `mongoose` as the object document modeler (ODM).
3. **Configure Database Connection**: Create a connection utility in `src/config/db.js` using `mongoose.connect(process.env.MONGODB_URI)`.

### Phase 2: Mongoose Schema Implementations
We will convert all 28 Sequelize models into unified Mongoose Schemas inside `src/models/`:

1. **`User`** (`user_master.js`): User accounts, password hashes, and references/embedded roles.
2. **`Customer`** (`customer.js`): Consolidates master data, credentials, profiles, and shipping addresses into one schema:
   ```javascript
   {
     customer_code: String,
     first_name: String,
     last_name: String,
     email: String,
     phone: String,
     billing_address: String,
     status: String,
     login: { passwordHash: String, last_login: Date },
     info: { trn_name: String, balance: Number, credit_limit: Number },
     shipping_addresses: [{ full_name: String, phone_number: String, pincode: String, address_line1: String, city: String, state: String }]
   }
   ```
3. **`Order`** (`order.js`): Consolidates order details and beneficiary info:
   ```javascript
   {
     order_number: String,
     customer: { type: ObjectId, ref: 'Customer' },
     order_date: Date,
     grand_total: Number,
     status: String,
     items: [{ item_id: ObjectId, quantity: Number, price: Number, net: Number }]
   }
   ```
4. **`QurbaniBooking`** (`qurbani_booking.js`): Embedded shares list:
   ```javascript
   {
     booking_number: String,
     vendor: { type: ObjectId, ref: 'User' },
     customer_name: String,
     shares: [{ share_type: String, quantity: Number, price: Number }]
   }
   ```
5. **`Item`** (`item.js`): Stores ERP item master, pricing, batches, and locations.
6. **Master Tables**: Simple collections for `ItemDepartment`, `Brand`, `Size`, `Family`, `SubFamily`, `Company`, `Location`, and `TaxMaster`.

### Phase 3: Route & Controller Migration
Modify all route controllers to perform Mongoose queries:
* `findAll()` $\rightarrow$ `find()`
* `findByPk()` $\rightarrow$ `findById()`
* `create()` $\rightarrow$ `new Model().save()` or `Model.create()`
* `update()` $\rightarrow$ `findByIdAndUpdate()`
* `destroy()` $\rightarrow$ `findByIdAndDelete()` or `deleteOne()`

### Phase 4: Validation & Execution
1. Update `src/server.js` to wait for the MongoDB connection to establish before listening on the port.
2. Run standard local checks to ensure the application starts flawlessly.

---

> [!NOTE]
> Embedding schemas simplifies queries tremendously. For example, retrieving a customer and all their shipping addresses changes from a complex Sequelize `JOIN` query to a single MongoDB document retrieve: `Customer.findById(id)`.

> [!IMPORTANT]
> The database connection string will default to a local MongoDB instance `mongodb://localhost:27017/charity` unless configured in the `.env` file.
