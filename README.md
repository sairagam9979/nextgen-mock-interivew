# AI Interview Application

A full-stack MERN application that provides AI-powered interview practice with voice and text capabilities. Users can practice interviews with different AI roles, receive real-time feedback, and track their progress over time.

## 🚀 Features

### Frontend (React)
- **User Authentication**: Secure login/signup with JWT
- **Role Selection**: Choose from predefined interview roles or create custom ones
- **Dual Input Modes**: 
  - 🎤 Voice input with real-time transcription
  - ⌨️ Text input for traditional typing
- **Real-time Conversation**: Live chat interface with AI interviewer
- **Voice Output**: Optional text-to-speech for AI responses
- **Session Management**: Start, continue, and end interview sessions
- **Progress Tracking**: View interview history and analytics
- **Modern UI**: Responsive design with Tailwind CSS

### Backend (Node.js + Express)
- **RESTful APIs**: Complete CRUD operations for interviews
- **Authentication**: JWT-based user authentication
- **AI Integration**: OpenAI GPT-4o for intelligent conversations
- **Voice Processing**: 
  - Whisper API for speech-to-text
  - TTS API for text-to-speech
- **Data Persistence**: MongoDB for storing sessions and user data
- **Security**: Rate limiting, input validation, and CORS protection

### AI Features
- **Dynamic Role Prompts**: AI adapts to different interview scenarios
- **Real-time Feedback**: Grammar analysis and confidence scoring
- **Contextual Responses**: AI maintains conversation context
- **Customizable Settings**: Adjust interview parameters and preferences

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework
- **React Router** - Client-side routing
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **Axios** - HTTP client
- **React Hot Toast** - Notifications

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **OpenAI API** - AI integration
- **JWT** - Authentication
- **Multer** - File uploads
- **Helmet** - Security headers

## 📋 Prerequisites

Before running this application, make sure you have:

- **Node.js** (v16 or higher)
- **MongoDB** (local installation or MongoDB Atlas)
- **OpenAI API Key** (for AI features)

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-interview-app
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Environment Setup**

   Create a `.env` file in the `server` directory:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # MongoDB Configuration
   MONGODB_URI=mongodb://localhost:27017/ai-interview

   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

   # OpenAI Configuration
   OPENAI_API_KEY=your-openai-api-key-here

   # Client URL (for CORS)
   CLIENT_URL=http://localhost:3000
   ```

4. **Start the application**
   ```bash
   # Development mode (both frontend and backend)
   npm run dev

   # Or start separately:
   npm run server  # Backend only
   npm run client  # Frontend only
   ```

## 📁 Project Structure

```
ai-interview-app/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── contexts/       # React contexts
│   │   └── index.js        # App entry point
│   └── package.json
├── server/                 # Node.js backend
│   ├── models/            # MongoDB schemas
│   ├── routes/            # API routes
│   ├── middleware/        # Custom middleware
│   ├── server.js          # Express server
│   └── package.json
├── package.json           # Root package.json
└── README.md
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `GET /api/auth/history` - Get interview history

### Interview Sessions
- `POST /api/interview/start` - Start new session
- `GET /api/interview/session/:id` - Get session details
- `POST /api/interview/session/:id/message` - Add message
- `POST /api/interview/session/:id/end` - End session
- `POST /api/interview/session/:id/abandon` - Abandon session

### AI Integration
- `POST /api/ai/chat` - Get AI response
- `POST /api/ai/transcribe` - Speech-to-text
- `POST /api/ai/synthesize` - Text-to-speech
- `GET /api/ai/role-prompts` - Get role suggestions

## 🎯 Usage

1. **Register/Login**: Create an account or sign in
2. **Choose Role**: Select from predefined roles or create custom ones
3. **Start Interview**: Begin your AI-powered interview session
4. **Interact**: Use voice or text to respond to AI questions
5. **Receive Feedback**: Get real-time analysis of your responses
6. **Track Progress**: Review your interview history and statistics

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Input validation and sanitization
- Rate limiting
- CORS protection
- Security headers with Helmet

## 🎨 UI/UX Features

- **Responsive Design**: Works on desktop and mobile
- **Dark/Light Mode**: Modern interface design
- **Real-time Updates**: Live conversation flow
- **Loading States**: Smooth user experience
- **Error Handling**: User-friendly error messages
- **Accessibility**: Keyboard navigation and screen reader support

## 🚀 Deployment

### Frontend (Vercel/Netlify)
```bash
cd client
npm run build
# Deploy the build folder
```

### Backend (Heroku/Railway)
```bash
cd server
# Set environment variables
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues:

1. Check the console for error messages
2. Verify your environment variables
3. Ensure MongoDB is running
4. Check your OpenAI API key is valid

## 🔮 Future Enhancements

- [ ] Video interview capabilities
- [ ] Advanced analytics dashboard
- [ ] Interview templates and scenarios
- [ ] Multi-language support
- [ ] Real-time collaboration features
- [ ] Advanced AI feedback systems
- [ ] Integration with job platforms
- [ ] Mobile app development

---

**Built with ❤️ using the MERN stack and OpenAI APIs** 