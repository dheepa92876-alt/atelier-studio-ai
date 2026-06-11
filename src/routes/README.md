# 🎨 Atelier - AI Image Generation Studio

Atelier is an AI-powered web application that transforms text prompts into unique images using modern image generation models. The platform provides users with creative control through prompt customization, negative prompts, model selection, and advanced generation parameters.

## 🚀 Features

* 📝 Text-to-Image Generation
* 💡 Prompt Suggestions
* 🚫 Negative Prompt Support
* ⚙️ Customizable Generation Parameters
* 🔄 Multiple Model Selection
* 🧠 Prompt Recommendations
* 📥 Download Generated Images
* 🎨 Modern and Responsive User Interface

## 🖼️ How It Works

1. Enter a text prompt describing the image you want.
2. Optionally add a negative prompt to avoid unwanted elements.
3. Select an image generation model.
4. Customize generation settings such as dimensions and sampling parameters.
5. Generate the image.
6. Download the generated result.

## 🛠️ Tech Stack

### Frontend

* React
* TypeScript
* Tailwind CSS
* TanStack Router
* TanStack Query

### Backend & APIs

* AI Horde API
* Server Functions

### Development Tools

* Vite
* Node.js
* npm

## 📂 Project Structure

```text
src/
├── components/
│   ├── ui/
│   └── reusable components
├── lib/
│   ├── horde.functions.ts
│   ├── model-presets.ts
│   └── prompt-inspiration.ts
├── routes/
│   ├── index.tsx
│   └── __root.tsx
├── server.ts
└── start.ts
```

## ⚙️ Installation

### Clone Repository

```bash
git clone https://github.com/your-username/atelier.git
cd atelier
```

### Install Dependencies

```bash
npm install
```

### Configure Environment Variables

Create a `.env` file in the project root:

```env
AI_HORDE_API_KEY=your_api_key_here
```

### Run Development Server

```bash
npm run dev
```

The application will be available at:

```text
http://localhost:3000
```

or

```text
http://localhost:5173
```

depending on your Vite configuration.

## 🎯 Learning Outcomes

This project helped us gain practical experience in:

* Generative AI workflows
* API integration
* Prompt engineering
* Frontend development
* Responsive UI design
* Asynchronous request handling
* Team collaboration and software development practices

## 🔮 Future Enhancements

* User Authentication
* Personal Image Gallery
* Image History Management
* Image Variations
* Upscaling Support
* Additional AI Model Integrations
* Cloud Deployment

## 👥 Team

This project was developed collaboratively by two team members as part of a learning and exploration initiative into Generative AI and modern web development.

## 📜 License

This project is intended for educational and learning purposes.

---

✨ "Every image begins with an idea. Atelier helps bring it to life."
