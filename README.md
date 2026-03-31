# MediAssistAI

A comprehensive healthcare platform that helps users find doctors, schedule appointments, and locate hospitals near them with an interactive map interface.

## Features

- **🔍 Doctor Search**: Search and filter doctors by specialty and location
- **📋 Doctor Directory**: Browse detailed doctor profiles and credentials
- **📅 Appointment Booking**: Schedule appointments with available doctors
- **🗺️ Hospital Locator**: Find nearby hospitals and healthcare facilities on an interactive map
- **📱 Responsive Design**: Fully responsive UI built with React and Tailwind CSS
- **🌐 Real-time Data**: MongoDB backend for persistent data storage

## Tech Stack

### Backend
- **Node.js** with **Express.js** - RESTful API server
- **MongoDB** - NoSQL database for storing hospital and doctor data
- **CORS** - Cross-Origin Resource Sharing for frontend-backend communication
- **Nodemon** - Development server with hot reload

### Frontend
- **React 18** - UI library
- **Vite** - Lightning-fast build tool
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Leaflet & React-Leaflet** - Interactive map functionality
- **Axios** - HTTP client for API requests
- **Lucide React** - Icon library

## Project Structure

```
MediasisstAI/
├── backend/
│   ├── server.js                 # Main Express server
│   ├── package.json
│   ├── config/
│   │   └── db.js                # MongoDB connection
│   ├── controllers/
│   │   ├── doctorController.js
│   │   └── appointmentController.js
│   ├── models/
│   │   ├── Doctor.js
│   │   └── Appointment.js
│   └── routes/
│       ├── doctorRoutes.js
│       ├── appointmentRoutes.js
│       └── mapRoutes.js
│
├── client/
│   ├── src/
│   │   ├── App.jsx               # Main app component
│   │   ├── main.jsx
│   │   ├── index.css
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── SearchBar.jsx
│   │   │   └── DoctorCard.jsx
│   │   └── pages/
│   │       ├── Home.jsx
│   │       ├── Search.jsx
│   │       ├── DoctorList.jsx
│   │       ├── MapPage.jsx
│   │       ├── Appointment.jsx
│   │       └── LabTests.jsx
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── package.json
│
└── README.md
```

## Prerequisites

- **Node.js** (v14 or higher)
- **npm** or **yarn**
- **MongoDB** (local or cloud instance)

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/ayushgaur475/MediAssistAI.git
cd MediasisstAI
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies

```bash
cd ../client
npm install
```

## Configuration

### Backend Setup

Create a `.env` file in the `backend` directory:

```env
MONGODB_URI=your_mongodb_connection_string
PORT=5000
NODE_ENV=development
```

### Frontend Setup

Update API configuration in your components to point to your backend:
- API Base URL: `http://localhost:5000/api`

## Running the Application

### Start Backend Server

```bash
cd backend
npm run dev
```

The backend will run on **http://localhost:5000**

### Start Frontend Development Server

```bash
cd client
npm run dev
```

The frontend will run on **http://localhost:5173**

### Production Build

```bash
cd client
npm run build
npm run preview
```

## API Endpoints

### Hospitals
- `GET /api/hospitals` - Get all hospitals
- `GET /api/hospitals/:id` - Get hospital details
- `POST /api/hospitals` - Create new hospital

### Doctors
- `GET /api/doctors` - Get all doctors
- `GET /api/doctors/:id` - Get doctor details
- `POST /api/doctors` - Create new doctor profile

### Appointments
- `GET /api/appointments` - Get all appointments
- `POST /api/appointments` - Book new appointment

### Map
- `GET /api/map/hospitals` - Get hospital locations for map

## Key Pages

| Page | Route | Description |
|------|-------|-------------|
| Home | `/` | Landing page with featured doctors |
| Search | `/search` | Advanced search for doctors and services |
| Doctor List | `/doctors` | Browse all available doctors |
| Map | `/map` | Interactive map showing hospitals |
| Appointment | `/appointment/:id` | Book appointment with doctor |
| Lab Tests | `/lab-tests` | View available lab tests |

## Features in Detail

### 🔍 Search Functionality
- Search doctors by name, specialty, and location
- Filter results by ratings and availability

### 📍 Map Integration
- Interactive map with Leaflet
- Hospital locations with details
- Real-time location services

### 📅 Appointment System
- Easy appointment booking
- Doctor availability calendar
- Appointment confirmation

## Scripts

### Backend
```bash
npm run start    # Start production server
npm run dev      # Start development server with nodemon
```

### Frontend
```bash
npm run dev      # Start Vite dev server
npm run build    # Build for production
npm run preview  # Preview production build
```

## Database Schema

### Doctor Model
```javascript
{
  name: String,
  specialty: String,
  qualifications: [String],
  hospital: String,
  availableSlots: [Date],
  rating: Number,
  experience: Number,
  contact: String
}
```

### Appointment Model
```javascript
{
  doctorId: ObjectId,
  patientName: String,
  patientEmail: String,
  appointmentDate: Date,
  reason: String,
  status: String
}
```

## Deployment

### Frontend (Vercel/Netlify)
```bash
cd client
npm run build
# Deploy the dist/ folder
```

### Backend (Heroku/Railway)
```bash
# Push to hosting platform
# Set environment variables on platform
# Deploy
```

## Troubleshooting

### MongoDB Connection Issues
- Verify MongoDB is running
- Check connection string in `.env`
- Ensure network access is allowed if using MongoDB Atlas

### CORS Errors
- Backend CORS is configured to accept requests from frontend
- Verify both servers are running on correct ports

### Port Already in Use
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact & Support

- **Author**: Ayush Gaur
- **Email**: ayushgaur475@gmail.com
- **GitHub**: [@ayushgaur475](https://github.com/ayushgaur475)

## Roadmap

- [ ] User authentication and profiles
- [ ] Payment integration
- [ ] Email notifications
- [ ] Multi-language support
- [ ] Mobile app
- [ ] AI-powered doctor recommendations
- [ ] Telemedicine features
- [ ] Lab test results integration

## Acknowledgments

- React community and documentation
- Express.js framework
- Tailwind CSS
- Leaflet map library
- MongoDB community

---

**Happy coding! 🚀**
