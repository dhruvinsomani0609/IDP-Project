# Document Upload Module with Supabase Authentication

A professional, production-ready document upload interface with Supabase authentication, drag-and-drop functionality, and beautiful UI animations.

## Features

### Authentication
- ✅ **User Sign Up** - Create new accounts with email verification
- ✅ **User Login** - Secure authentication with Supabase
- ✅ **Session Management** - Automatic session handling and persistence
- ✅ **Protected Routes** - Upload functionality only available to authenticated users
- ✅ **User Profile** - Display user information in dashboard header

### Document Upload
- ✅ **Drag & Drop** - Intuitive file upload with visual feedback
- ✅ **Multi-Format Support** - Images (JPEG, PNG, WEBP) and PDFs
- ✅ **File Validation** - Size limits (10MB), type checking, duplicate prevention
- ✅ **Preview Grid** - Responsive grid layout with image thumbnails
- ✅ **Batch Upload** - Upload multiple files at once
- ✅ **File Management** - Remove files before upload
- ✅ **Progress Indicators** - Visual feedback during upload process

### Design
- ✅ **Enterprise Clean** - Professional Slate/Zinc color palette
- ✅ **Smooth Animations** - Framer Motion micro-interactions
- ✅ **Responsive Design** - Mobile-first, works on all screen sizes
- ✅ **Accessibility** - Keyboard navigation and ARIA labels
- ✅ **Modern UI** - Glassmorphism, gradients, and shadows

## Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS 3** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **Lucide React** - Icon library
- **Supabase** - Authentication and backend

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Go to [https://supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Wait for the project to be set up (this takes a few minutes)
4. Go to **Settings** > **API** in your Supabase dashboard
5. Copy the following values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (a long string starting with `eyJ...`)

### 3. Configure Environment Variables

1. Create a `.env` file in the root directory:

```bash
# Copy the example file
cp .env.example .env
```

2. Open `.env` and add your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Enable Email Authentication in Supabase

1. In your Supabase dashboard, go to **Authentication** > **Providers**
2. Make sure **Email** is enabled
3. Configure email templates if needed (optional)

### 5. Run the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Usage

### First Time Setup

1. **Sign Up**
   - Click "Sign Up" on the auth form
   - Enter your full name, email, and password (min 6 characters)
   - Check your email for verification link
   - Click the verification link

2. **Sign In**
   - Enter your email and password
   - Click "Sign In"

3. **Upload Documents**
   - Once logged in, you'll see the upload interface
   - Drag and drop files or click "Browse Files"
   - Supported formats: JPEG, PNG, WEBP, PDF
   - Maximum file size: 10MB per file
   - Click "Upload Files" when ready

### Features in Detail

#### Authentication Flow
- Users must be authenticated to access the upload module
- Sessions persist across browser refreshes
- Sign out button in the header
- Email verification required for new accounts

#### File Upload
- **Drag & Drop**: Drag files from your computer onto the upload zone
- **Browse**: Click "Browse Files" to open file picker
- **Preview**: See thumbnails for images, icons for PDFs
- **Remove**: Hover over files and click X to remove
- **Validation**: Automatic checking for file type, size, and duplicates

#### Responsive Design
- **Mobile**: 2-column grid layout
- **Desktop**: 4-column grid layout
- **Tablet**: Adaptive layout

## Project Structure

```
src/
├── components/
│   ├── AuthForm.tsx          # Login/Signup form
│   ├── Dashboard.tsx         # Main dashboard with user info
│   ├── DocumentUpload.tsx    # File upload component
│   └── FilePreviewCard.tsx   # Individual file preview card
├── contexts/
│   └── AuthContext.tsx       # Authentication state management
├── lib/
│   └── supabase.ts          # Supabase client configuration
├── types/
│   └── types.ts             # TypeScript type definitions
├── utils/
│   └── utils.ts             # Utility functions
├── App.tsx                  # Main app component
└── index.css                # Global styles
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous key | Yes |

## Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Troubleshooting

### "Invalid API key" error
- Make sure you've copied the correct anon/public key from Supabase
- Check that your `.env` file is in the root directory
- Restart the dev server after changing `.env`

### Email verification not working
- Check your spam folder
- In Supabase dashboard, go to Authentication > Email Templates to customize
- For development, you can disable email verification in Supabase settings

### Files not uploading
- Check file size (must be under 10MB)
- Verify file type (only JPEG, PNG, WEBP, PDF)
- Check browser console for errors

## Security Notes

- Never commit your `.env` file to version control
- The `.env` file is already in `.gitignore`
- Use environment variables for all sensitive data
- The anon key is safe to use in client-side code (it's public)

## Future Enhancements

Potential features to add:
- [ ] File storage in Supabase Storage
- [ ] User-specific file management
- [ ] File sharing capabilities
- [ ] Advanced file organization (folders, tags)
- [ ] File search and filtering
- [ ] Download uploaded files
- [ ] Social authentication (Google, GitHub)
- [ ] Password reset functionality
- [ ] Profile management

## License

MIT

## Support

For issues or questions, please open an issue on GitHub or contact support.
