import { useState, useRef } from "react";
import { ReactSVG } from "react-svg";

interface Design {
  id: number;
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

type ShirtView = "front" | "back";

const ShirtDesigner: React.FC = () => {
  const [shirtColor, setShirtColor] = useState<string>("#ffffff");
  const [frontDesigns, setFrontDesigns] = useState<Design[]>([]);
  const [backDesigns, setBackDesigns] = useState<Design[]>([]);
  const [currentView, setCurrentView] = useState<ShirtView>("front");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const newDesign: Design = {
        id: Date.now(),
        src: event.target?.result as string,
        x: 100,
        y: 100,
        width: 150,
        height: 150,
      };

      if (currentView === "front") {
        setFrontDesigns([...frontDesigns, newDesign]);
      } else {
        setBackDesigns([...backDesigns, newDesign]);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, design: Design) => {
    const target = e.target as HTMLDivElement;
    const oldImg = target.querySelector("img");

    if (!oldImg) return;

    e.dataTransfer.setDragImage(oldImg, design.width / 2, design.height / 2);
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>, design: Design) => {
    const target = e.target as HTMLDivElement;
    const rect = target.parentElement?.getBoundingClientRect();
    if (!rect) return;

    const newX = e.clientX - rect.left - design.width / 2;
    const newY = e.clientY - rect.top - design.height / 2;

    updateDesign(design.id, { x: newX, y: newY });
  };

  const handleRedimension = (e: React.MouseEvent, design: Design) => {
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = design.width;
    const startHeight = design.height;

    const doResize = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      updateDesign(design.id, {
        width: Math.max(50, startWidth + deltaX),
        height: Math.max(50, startHeight + deltaY),
      });
    };

    const stopResize = () => {
      window.removeEventListener("mousemove", doResize);
      window.removeEventListener("mouseup", stopResize);
    };

    window.addEventListener("mousemove", doResize);
    window.addEventListener("mouseup", stopResize);
  };

  const updateDesign = (id: number, updates: Partial<Design>) => {
    const updateArray = (designs: Design[]) =>
      designs.map((design) => (design.id === id ? { ...design, ...updates } : design));

    if (currentView === "front") {
      setFrontDesigns(updateArray(frontDesigns));
    } else {
      setBackDesigns(updateArray(backDesigns));
    }
  };

  const handleRemove = (id: number) => {
    const updateArray = (designs: Design[]) => designs.filter((design) => design.id !== id);

    if (currentView === "front") {
      setFrontDesigns(updateArray(frontDesigns));
    } else {
      setBackDesigns(updateArray(backDesigns));
    }
  };

  const renderDesigns = () => {
    const designs = currentView === "front" ? frontDesigns : backDesigns;

    return designs.map((design) => (
      <div
        key={design.id}
        className="group absolute border-2 border-dashed border-transparent cursor-move hover:border-blue-500 active:border-blue-500 transition-colors"
        style={{
          left: `${design.x}px`,
          top: `${design.y}px`,
          width: `${design.width}px`,
          height: `${design.height}px`,
        }}
        draggable
        onDragStart={(e) => handleDragStart(e, design)}
        onDragEnd={(e) => handleDragEnd(e, design)}
      >
        <img
          src={design.src}
          alt="Design"
          className="w-full h-full object-contain"
          draggable="false"
        />

        {/* Controles de redimensionamento */}
        <div
          className="absolute -bottom-2 -right-2 w-5 h-5 bg-blue-500 rounded-full cursor-nwse-resize opacity-0 group-hover:opacity-100 transition-all"
          onMouseDown={(e) => handleRedimension(e, design)}
        />

        {/* Botão de remoção */}
        <button
          className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full cursor-pointer w-6 h-6 opacity-0 group-hover:opacity-100 transition-all"
          onClick={() => handleRemove(design.id)}
        >
          ×
        </button>
      </div>
    ));
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold mb-4">Customize sua Camisa</h2>

          <div className="mb-6">
            <label className="block mb-2 font-medium">Cor da Camisa:</label>
            <input
              type="color"
              value={shirtColor}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setShirtColor(e.target.value)}
              className="w-full h-12 cursor-pointer"
            />
          </div>

          <div className="mb-6">
            <label className="block mb-2 font-medium">Visualização:</label>
            <div className="flex space-x-2">
              <button
                className={`flex-1 py-2 px-4 rounded ${
                  currentView === "front" ? "bg-blue-600 text-white" : "bg-gray-200"
                }`}
                onClick={() => setCurrentView("front")}
              >
                Frente
              </button>
              <button
                className={`flex-1 py-2 px-4 rounded ${
                  currentView === "back" ? "bg-blue-600 text-white" : "bg-gray-200"
                }`}
                onClick={() => setCurrentView("back")}
              >
                Costas
              </button>
            </div>
          </div>

          <div className="mb-6">
            <button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded transition"
              onClick={() => fileInputRef.current?.click()}
            >
              Adicionar Imagem
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
            <p className="text-sm text-gray-500 mt-2">
              Adicione imagens à {currentView === "front" ? "frente" : "costas"} da camisa
            </p>
          </div>

          <div className="mt-8">
            <button className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded font-medium text-lg transition">
              Finalizar Design
            </button>
          </div>
        </div>

        {/* Área de Visualização */}
        <div className="lg:col-span-2 flex flex-col items-center">
          <div
            className="relative bg-gray-100 rounded-lg shadow-xl overflow-hidden"
            style={{ width: "500px", height: "600px" }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-80 h-96" style={{ backgroundColor: "#ffffff" }}>
                {/* Área interativa para designs */}
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage:
                      "linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)",
                    backgroundSize: "20px 20px",
                    backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
                  }}
                >
                  <ReactSVG
                    key={shirtColor}
                    src="src\assets\shirts\tshirt.svg"
                    afterInjection={(svg) => {
                      svg.querySelectorAll("path").forEach((path) => {
                        path.style.fill = shirtColor;
                      });
                    }}
                    className="h-full w-full [&>div,&_svg]:h-full [&>div,&_svg]:w-full"
                  />

                  {renderDesigns()}
                </div>

                {/* Indicador de frente/costas */}
                <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                  {currentView === "front" ? "FRENTE" : "COSTAS"}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 text-center text-gray-600">
            <p className="mb-2">• Arraste as imagens para posicionar</p>
            <p>• Use o canto inferior direito para redimensionar</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShirtDesigner;
