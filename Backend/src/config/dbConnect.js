import mongoose from "mongoose";

const dbConnect = async () => {
  try {
    const connect = await mongoose.connect(process.env.MONGODB_URI);

    console.log(
      `✅ Database Connected: ${connect.connection.host}, ${connect.connection.name}`,
    );

    // Mock sessions for local/standalone MongoDB instances (without replica sets)
    const topologyType = connect.connection.client?.topology?.description?.type || "";
    const isReplicaSet = topologyType.includes("ReplicaSet") || topologyType.includes("Sharded");

    if (!isReplicaSet) {
      console.log("⚠️ Running on standalone MongoDB. Patching transaction sessions for standalone compatibility...");

      class MockSession {
        constructor() {
          this.isMock = true;
          this.options = {};
          this.client = {
            s: {
              options: {},
            },
          };
        }
        hasEnded() {
          return false;
        }
        startTransaction() {}
        async commitTransaction() {}
        async abortTransaction() {}
        async endSession() {}
        inTransaction() {
          return false;
        }
        async withTransaction(fn) {
          return fn(this);
        }
      }

      // Overwrite mongoose.startSession
      mongoose.startSession = async function () {
        return new MockSession();
      };

      // Overwrite mongoose.Connection.prototype.startSession
      mongoose.Connection.prototype.startSession = async function () {
        return new MockSession();
      };

      // Overwrite Query.prototype.session
      const originalQuerySession = mongoose.Query.prototype.session;
      mongoose.Query.prototype.session = function (session) {
        if (session && session.isMock) {
          if (this && this.options) delete this.options.session;
          if (this && this._mongooseOptions) delete this._mongooseOptions.session;
          return this;
        }
        return originalQuerySession.apply(this, arguments);
      };

      // Overwrite Query.prototype.exec
      const originalQueryExec = mongoose.Query.prototype.exec;
      mongoose.Query.prototype.exec = function () {
        if (this && this.options && this.options.session && this.options.session.isMock) {
          delete this.options.session;
        }
        if (this && this._mongooseOptions && this._mongooseOptions.session && this._mongooseOptions.session.isMock) {
          delete this._mongooseOptions.session;
        }
        return originalQueryExec.apply(this, arguments);
      };

      // Overwrite Aggregate.prototype.session if present
      if (mongoose.Aggregate) {
        const originalAggregateSession = mongoose.Aggregate.prototype.session;
        mongoose.Aggregate.prototype.session = function (session) {
          if (session && session.isMock) {
            return this;
          }
          return originalAggregateSession.apply(this, arguments);
        };
      }

      // Overwrite Model.bulkWrite
      const originalBulkWrite = mongoose.Model.bulkWrite;
      mongoose.Model.bulkWrite = function (ops, options) {
        if (options && options.session && options.session.isMock) {
          const { session, ...rest } = options;
          return originalBulkWrite.call(this, ops, rest);
        }
        return originalBulkWrite.apply(this, arguments);
      };

      // Overwrite Model.create
      const originalModelCreate = mongoose.Model.create;
      mongoose.Model.create = function (docs, options) {
        if (options && options.session && options.session.isMock) {
          const { session, ...rest } = options;
          return originalModelCreate.call(this, docs, rest);
        }
        if (Array.isArray(docs) && options && options.session && options.session.isMock) {
          const { session, ...rest } = options;
          return originalModelCreate.call(this, docs, rest);
        }
        return originalModelCreate.apply(this, arguments);
      };

      // Overwrite Model.insertMany
      const originalInsertMany = mongoose.Model.insertMany;
      mongoose.Model.insertMany = function (docs, options) {
        if (options && options.session && options.session.isMock) {
          const { session, ...rest } = options;
          return originalInsertMany.call(this, docs, rest);
        }
        return originalInsertMany.apply(this, arguments);
      };

      // Overwrite Model.prototype.save
      const originalModelPrototypeSave = mongoose.Model.prototype.save;
      mongoose.Model.prototype.save = function (options) {
        if (options && options.session && options.session.isMock) {
          const { session, ...rest } = options;
          return originalModelPrototypeSave.call(this, rest);
        }
        return originalModelPrototypeSave.apply(this, arguments);
      };
    }
  } catch (err) {
    console.error("❌Database connection failed", err);
    process.exit(1);
  }
};

export default dbConnect;
