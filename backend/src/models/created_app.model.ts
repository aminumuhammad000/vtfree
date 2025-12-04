import mongoose, { Schema, Document } from 'mongoose';

export interface ICreatedApp extends Document {
    app_id: string;
    owner_id: mongoose.Types.ObjectId;
    app_name: string;
    package_name: string;

    // Platform Selection
    platforms: {
        android: boolean;
        ios: boolean;
        web: boolean;
    };

    // Branding
    branding: {
        logo_url?: string;
        primary_color: string;
        secondary_color: string;
        app_icon_url?: string;
    };

    // Status
    status: 'pending' | 'building' | 'live' | 'suspended';
    build_status: {
        android: 'not_started' | 'building' | 'completed' | 'failed';
        ios: 'not_started' | 'building' | 'completed' | 'failed';
        web: 'not_started' | 'building' | 'completed' | 'failed';
    };

    // Payment
    payment_status: 'pending' | 'paid' | 'refunded';
    total_paid: number;

    // Auto-generated Admin
    admin_email: string;
    admin_password_hash: string;

    // Timestamps
    created_at: Date;
    updated_at: Date;
    launched_at?: Date;
}

const CreatedAppSchema: Schema = new Schema({
    app_id: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    owner_id: {
        type: Schema.Types.ObjectId,
        ref: 'VTfreeUser',
        required: true,
        index: true,
    },
    app_name: {
        type: String,
        required: true,
        trim: true,
    },
    package_name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },

    // Platform Selection
    platforms: {
        android: {
            type: Boolean,
            default: false,
        },
        ios: {
            type: Boolean,
            default: false,
        },
        web: {
            type: Boolean,
            default: false,
        },
    },

    // Branding
    branding: {
        logo_url: {
            type: String,
        },
        primary_color: {
            type: String,
            default: '#16a34a',
        },
        secondary_color: {
            type: String,
            default: '#22c55e',
        },
        app_icon_url: {
            type: String,
        },
    },

    // Status
    status: {
        type: String,
        enum: ['pending', 'building', 'live', 'suspended'],
        default: 'pending',
        index: true,
    },
    build_status: {
        android: {
            type: String,
            enum: ['not_started', 'building', 'completed', 'failed'],
            default: 'not_started',
        },
        ios: {
            type: String,
            enum: ['not_started', 'building', 'completed', 'failed'],
            default: 'not_started',
        },
        web: {
            type: String,
            enum: ['not_started', 'building', 'completed', 'failed'],
            default: 'not_started',
        },
    },

    // Payment
    payment_status: {
        type: String,
        enum: ['pending', 'paid', 'refunded'],
        default: 'pending',
    },
    total_paid: {
        type: Number,
        default: 0,
    },

    // Auto-generated Admin
    admin_email: {
        type: String,
        required: true,
    },
    admin_password_hash: {
        type: String,
        required: true,
    },

    // Timestamps
    created_at: {
        type: Date,
        default: Date.now,
    },
    updated_at: {
        type: Date,
        default: Date.now,
    },
    launched_at: {
        type: Date,
    },
});

// Update timestamp on save
CreatedAppSchema.pre('save', function (next) {
    this.updated_at = new Date();
    next();
});

// Indexes for faster queries
CreatedAppSchema.index({ owner_id: 1, status: 1 });
CreatedAppSchema.index({ app_id: 1 });
CreatedAppSchema.index({ package_name: 1 });

export default mongoose.model<ICreatedApp>('CreatedApp', CreatedAppSchema);
