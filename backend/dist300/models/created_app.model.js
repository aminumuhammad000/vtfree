import mongoose, { Schema } from 'mongoose';
const CreatedAppSchema = new Schema({
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
    require_approval: {
        type: Boolean,
        default: false,
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
    // Publishing Options
    publish_play_store: {
        type: Boolean,
        default: false,
    },
    publish_app_store: {
        type: Boolean,
        default: false,
    },
    publish_web: {
        type: Boolean,
        default: false,
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
        enum: ['pending', 'building', 'live', 'suspended', 'failed'],
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
    // Real-time Build Progress
    build_progress: {
        type: Number,
        default: 0,
    },
    build_stage: {
        type: String,
        default: '',
    },
    // Download Links
    download_links: {
        android: { type: String },
        ios: { type: String },
        web: { type: String },
    },
    // GitHub Assets (Private)
    github_assets: {
        android: { type: String },
        ios: { type: String },
        web: { type: String },
    },
    // GitHub & Expanded Build Status
    github_repo: { type: String },
    last_commit: { type: String },
    build_status_full: {
        type: String,
        enum: ['queued', 'building', 'completed', 'failed', 'custom_pending'],
    },
    build_error: { type: String },
    last_build_id: { type: String },
    last_successful_step: { type: String },
    estimated_finish_at: { type: Date },
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
        paystack_secret_key: { type: String },
        paystack_public_key: { type: String },
        monnify_api_key: { type: String },
        monnify_secret_key: { type: String },
        monnify_contract_code: { type: String },
    },
    // Referral Settings
    referral_settings: {
        enabled: { type: Boolean, default: false },
        amount: { type: Number, default: 0 },
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
export default mongoose.model('CreatedApp', CreatedAppSchema);
