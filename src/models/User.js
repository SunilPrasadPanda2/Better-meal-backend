import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from 'jsonwebtoken';

const UserSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    mobile: {
      type: String,
      match: [/^\d{10}$/],
    },
    email: {
      type: String,
      required: true,
      unique: true,
      match: [/\S+@\S+\.\S+/, 'is invalid']
    },
    password: {
      type: String,
      required: false,
    },
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },
    image: {
      type: String,
      required: false,
      allowNull: true,
    },
    gender: {
      type: String,
      required: false,
      allowNull: true,
    },
    weight: {
      type: Number,
      required: false,
      allowNull: true,
    },
    height: {
      type: Number,
      required: false,
      allowNull: true,
    },
    dateofbirth: {
      type: Date,
    },
    platform: {
      type: String,
      required: false,
      allowNull: true,
    },
    nutritionscore: [
      {
        date: {
          type: Date,
          required: true
        },
        score: {
          type: Number,
          default: 0
        }
      }
    ],
    gutscore: [
      {
        date: {
          type: Date,
          required: true
        },
        score: {
          type: Number,
          default: 0
        }
      }
    ],
    biomarker: {
      type: Number,
      default: 0,
    },
    medication: {
      type: Array,
      required: false,
      default: [],
    },
    smoker: {
      type: Number,
      default: 0,
      required: true
    }, 
    drinker: {
      type: Number,
      default: 0,
      required: true
    }
  },
  {
    timestamps: true,
  }
);

// Middleware to hash password before saving, if needed
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Method to compare password
UserSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

UserSchema.methods.generateAuthToken = function () {
  return jwt.sign(
    { _id: this._id, email: this.email, role: this.role},
    process.env.AUTH_TOKEN,
    { algorithm: 'HS256', expiresIn: '15m' }
  );
};

UserSchema.methods.generateAuthRefreshToken = function () {
  return jwt.sign(
     { _id: this._id, email: this.email, role: this.role},
    process.env.REFRESH_TOKEN,
    { algorithm: 'HS256', expiresIn: '7d'}
  );
}

const User = mongoose.model('User', UserSchema);

export default User;
