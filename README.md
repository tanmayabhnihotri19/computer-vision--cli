# VisionCLI 🚀

A terminal-based computer vision tool for image analysis and automated report generation using Gemini AI.

## Features

- **Terminal Interface**: A retro-style CLI built with React and Tailwind CSS.
- **Image Analysis**: Deep visual understanding using `gemini-3-flash-preview`.
- **Object Detection**: Identify and locate objects within images.
- **Report Generation**: Automatically generate professional technical reports in Markdown.
- **Command-driven**: Control everything via simple commands like `upload`, `analyze`, and `report`.

## Commands

| Command | Description |
|---------|-------------|
| `help` | List all available commands |
| `upload` | Upload an image for analysis |
| `analyze` | Run general vision analysis on current image |
| `detect` | Specific object detection command |
| `report` | Generate a full technical report (Markdown) |
| `status` | Show current session status |
| `clear` | Clear the terminal screen |

## Getting Started

1. **Upload an Image**: Type `upload` or click the upload icon in the input bar.
2. **Analyze**: Type `analyze` to get a detailed description of the image.
3. **Generate Report**: Once analyzed, type `report` to create a formal document.
4. **Download**: Use the download button in the report view to save the `.md` file.

## Tech Stack

- **Frontend**: React 19, Tailwind CSS 4, Motion
-  Google Gemini API (@google/genai)
- **Icons**: Lucide React
- **Markdown**: React Markdown

## License

Apache-2.0
