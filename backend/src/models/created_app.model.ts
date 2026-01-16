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

    // Services
    services: string[];

    // Branding
    branding: {
        logo_url?: string;
        primary_color: string;
        secondary_color: string;
        accent_color?: string;
        background_color?: string;
        sidebar_bg_start?: string;
        sidebar_bg_end?: string;
        app_icon_url?: string;
        app_display_name?: string;
        app_tagline?: string;
        last_updated?: Date;
    };

    // Company Details
    company?: {
        name?: string;
        email?: string;
        phone?: string;
        address?: string;
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

    // Email Settings
    email_settings: {
        provider: 'gmail' | 'other';
        host?: string;
        port?: string;
        user?: string;
        password?: string;
        from_name?: string;
        from_address?: string;
    };

    // Payment Settings
    payment_settings: {
        default_gateway: string;
        vtpay_api_key?: string;
        vtpay_secret_key?: string;
        vtpay_public_key?: string;
        payrant_api_key?: string;
        payrant_webhook_secret?: string;
        paystack_secret_key?: string;
        paystack_public_key?: string;
        monnify_api_key?: string;
        monnify_secret_key?: string;
        monnify_contract_code?: string;
    };

    // Timestamps
    created_at: Date;
    updated_at: Date;
    launched_at?: Date;
    version: string;
}

const CreatedAppSchema: Schema = new Schema({
    app_id: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    version: {
        type: String,
        default: '1.0.0',
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

    // Services
    services: {
        type: [String],
        default: [],
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
        accent_color: {
            type: String,
            default: '#4ade80',
        },
        background_color: {
            type: String,
            default: '#f8fafc',
        },
        sidebar_bg_start: {
            type: String,
            default: '#052e16',
        },
        sidebar_bg_end: {
            type: String,
            default: '#14532d',
        },
        app_icon_url: {
            type: String,
        },
        app_display_name: {
            type: String,
        },
        app_tagline: {
            type: String,
        },
        last_updated: {
            type: Date,
        },
    },

    // Company Details
    company: {
        name: { type: String, trim: true },
        email: { type: String, trim: true },
        phone: { type: String, trim: true },
        address: { type: String, trim: true },
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

    // Email Settings
    email_settings: {
        provider: { type: String, enum: ['gmail', 'other'], default: 'other' },
        host: { type: String },
        port: { type: String },
        user: { type: String },
        password: { type: String },
        from_name: { type: String },
        from_address: { type: String },
    },

    // Payment Settings
    payment_settings: {
        default_gateway: { type: String, default: 'vtpay' },
        vtpay_api_key: { type: String },
        vtpay_secret_key: { type: String },
        vtpay_public_key: { type: String },
        payrant_api_key: { type: String },
        payrant_webhook_secret: { type: String },
        paystack_secret_key: { type: String },
        paystack_public_key: { type: String },
        monnify_api_key: { type: String },
        monnify_secret_key: { type: String },
        monnify_contract_code: { type: String },
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
