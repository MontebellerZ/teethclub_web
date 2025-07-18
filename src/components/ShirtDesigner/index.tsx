import React from "react";
import { useState, useRef } from "react";
import { ReactSVG } from "react-svg";
import Logo from "/logo.webp";
import ShirtImg from "../../assets/shirts/tshirt.svg";
import { FaInstagram, FaTimes, FaWhatsapp } from "react-icons/fa";
import { toast } from "react-toastify";
import { RxTransparencyGrid } from "react-icons/rx";
import Api from "../../config/Api";

const MIN_RESIZE = 20;

interface Design {
  id: number;
  src: string;
  srcNoBackground?: string;
  useNoBackground?: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface VisualizationOpt {
  label: string;
  value: "front" | "back";
}

const visualizationOpts: VisualizationOpt[] = [
  { label: "Frente", value: "front" },
  { label: "Costas", value: "back" },
];

function ShirtDesigner() {
  const [shirtColor, setShirtColor] = useState("#ffffff");
  const [frontDesigns, setFrontDesigns] = useState<Design[]>([]);
  const [backDesigns, setBackDesigns] = useState<Design[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [currentView, setCurrentView] = useState<VisualizationOpt>(visualizationOpts[0]);
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const shirtRef = useRef<HTMLDivElement>(null);

  const getClientPos = (e: React.MouseEvent | React.TouchEvent) => {
    return "touches" in e ? e.touches[0] : e;
  };

  const getDragPosition = (e: React.MouseEvent | React.TouchEvent, design: Design) => {
    const { clientX, clientY } = getClientPos(e);

    const shirt = shirtRef.current?.getBoundingClientRect();
    if (!shirt) return { x: 0, y: 0 };

    const pos = {
      x: clientX - shirt.left - design.width / 2,
      y: clientY - shirt.top - design.height / 2,
    };

    return pos;
  };

  const updateDesign = (id: number, updates: Partial<Design>) => {
    const updateArray = (designs: Design[]) =>
      designs.map((design) => (design.id === id ? { ...design, ...updates } : design));

    if (currentView.value === "front") {
      setFrontDesigns(updateArray(frontDesigns));
    } else {
      setBackDesigns(updateArray(backDesigns));
    }
  };

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    e.preventDefault();
  };

  const handleDrag = (e: React.MouseEvent | React.TouchEvent, design: Design) => {
    if (!isDragging) return;

    e.preventDefault();

    const { x, y } = getDragPosition(e, design);

    updateDesign(design.id, { x, y });
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleRedimension = (e: React.MouseEvent | React.TouchEvent, design: Design) => {
    e.preventDefault();
    e.stopPropagation();

    const { clientX, clientY } = getClientPos(e);

    const startX = clientX;
    const startY = clientY;
    const startWidth = design.width;
    const startHeight = design.height;

    const doResize = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      updateDesign(design.id, {
        width: Math.max(MIN_RESIZE, startWidth + deltaX),
        height: Math.max(MIN_RESIZE, startHeight + deltaY),
      });
    };

    const stopResize = () => {
      window.removeEventListener("mousemove", doResize);
      window.removeEventListener("mouseup", stopResize);
    };

    window.addEventListener("mousemove", doResize);
    window.addEventListener("mouseup", stopResize);
  };

  const handleRemove = (id: number) => {
    const updateArray = (designs: Design[]) => designs.filter((design) => design.id !== id);

    if (currentView.value === "front") {
      setFrontDesigns(updateArray(frontDesigns));
    } else {
      setBackDesigns(updateArray(backDesigns));
    }
  };

  const handleRemoveBackground = async (design: Design) => {
    if (loading) {
      return toast.warn("Aguarde o carregamento anterior finalizar.");
    }

    const sendRemoveReq = async () => {
      setLoading(true);

      try {
        const imageUrl = await Api.removeBackground(design.src);

        if (!imageUrl) throw "Sem resposta da requisição de background";

        updateDesign(design.id, {
          srcNoBackground: imageUrl,
          useNoBackground: true,
        });
      } catch (error) {
        console.log(error);
        throw error;
      } finally {
        setLoading(false);
      }
    };

    toast.promise(sendRemoveReq(), {
      pending: "Removendo o fundo...",
      success: "Fundo removido com sucesso!",
      error: "Não foi possível remover o fundo da sua imagem.",
    });
  };

  const handleUseBackground = async (e: React.MouseEvent | React.TouchEvent, design: Design) => {
    e.preventDefault();
    e.stopPropagation();

    if (!design.srcNoBackground) {
      handleRemoveBackground(design);
      return;
    }

    updateDesign(design.id, { useNoBackground: !design.useNoBackground });
  };

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

      if (currentView.value === "front") {
        setFrontDesigns([...frontDesigns, newDesign]);
      } else {
        setBackDesigns([...backDesigns, newDesign]);
      }
    };
    reader.readAsDataURL(file);

    e.target.value = "";
  };

  const handleSendDesign = () => {};

  const renderDesigns = () => {
    const designs = currentView.value === "front" ? frontDesigns : backDesigns;

    return designs.map((design) => (
      <div
        key={design.id}
        className="imageDesignContent group absolute border-2 border-dashed border-transparent cursor-move hover:border-contrast active:border-contrast transition-colors touch-none"
        style={{
          left: `${design.x}px`,
          top: `${design.y}px`,
          width: `${design.width}px`,
          height: `${design.height}px`,
        }}
        onMouseDown={(e) => handleDragStart(e)}
        onMouseMove={(e) => handleDrag(e, design)}
        onMouseUp={() => handleDragEnd()}
        onTouchStart={(e) => handleDragStart(e)}
        onTouchMove={(e) => handleDrag(e, design)}
        onTouchEnd={() => handleDragEnd()}
      >
        <img
          src={design.useNoBackground ? design.srcNoBackground : design.src}
          alt="Design"
          className="w-full h-full object-contain"
        />

        <div className="top-0 left-0 right-0 bottom-0" />

        <div
          className="-bottom-2 -right-2 bg-blue-500 cursor-nwse-resize"
          onMouseDown={(e) => handleRedimension(e, design)}
          title="Redimensionar"
        />

        <button
          className="-bottom-2 -left-2 bg-gray-300 text-gray-900 text-xs"
          onClick={(e) => handleUseBackground(e, design)}
          title="Remover fundo"
        >
          <RxTransparencyGrid />
        </button>

        <button
          className="-top-3 -right-3 bg-red-500 text-white cursor-pointer"
          onClick={() => handleRemove(design.id)}
          title="Apagar imagem"
        >
          <FaTimes />
        </button>
      </div>
    ));
  };

  return (
    <div className="h-full w-full p-4 flex flex-col lg:flex-row items-center lg:justify-center overflow-auto">
      <div className="max-w-6xl lg:w-full grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        <div className="bg-primary p-6 rounded-lg shadow-lg flex flex-col gap-5">
          <div className="flex flex-col">
            <img src={Logo} className="self-center max-w-56 w-full" />

            <h2 className="text-xl font-bold">Customize sua Camisa</h2>
          </div>

          <div className="flex flex-col gap-1">
            <label className="block font-medium">Cor da Camisa:</label>
            <input
              type="color"
              value={shirtColor}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setShirtColor(e.target.value)}
              className="w-full h-12 cursor-pointer"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="block font-medium">Visualização:</label>
            <div className="flex gap-2">
              {visualizationOpts.map((opt, i) => (
                <button
                  key={i}
                  className={`flex-1 py-2 px-4 rounded shadow-md transition ${
                    currentView === opt
                      ? "bg-secondary hover:bg-secondary/80"
                      : "bg-gray-200 hover:bg-highlight/20"
                  }`}
                  onClick={() => setCurrentView(opt)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <button
              className="w-full bg-contrast text-white hover:bg-contrast/80 py-3 px-4 rounded transition"
              onClick={() => fileInputRef.current?.click()}
            >
              Adicionar Imagem
            </button>
            <p className="text-sm text-gray-500">
              Adicione imagens à {currentView.label.toLowerCase()} da camisa
            </p>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
          </div>

          <button
            className="w-full bg-confirm hover:bg-confirm/80 text-white py-3 px-4 rounded font-medium text-lg transition"
            onClick={handleSendDesign}
          >
            Finalizar Design
          </button>
        </div>

        <div className="lg:col-span-2 flex flex-col items-center gap-4">
          <div className="bg-gray-100 rounded-lg shadow-xl overflow-hidden w-full sm:w-[400px] lg:w-[500px] aspect-[5/6] select-none">
            <div className="h-full w-full p-[8%] lg:p-[16%]">
              <div className="relative w-full h-full" ref={shirtRef}>
                <div className="h-full w-full bg-[linear-gradient(45deg,#fff_25%,transparent_25%),linear-gradient(-45deg,#fff_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#fff_75%),linear-gradient(-45deg,transparent_75%,#fff_75%)] bg-[length:20px_20px] bg-[position:0_0,0_10px,10px_-10px,-10px_0px]">
                  <ReactSVG
                    key={shirtColor}
                    src={ShirtImg}
                    afterInjection={(svg) => {
                      svg.querySelectorAll("path").forEach((path) => {
                        path.style.fill = shirtColor;
                      });
                    }}
                    className="h-full w-full [&>div,&_svg]:h-full [&>div,&_svg]:w-full"
                  />

                  {renderDesigns()}
                </div>

                <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                  {currentView.label.toUpperCase()}
                </div>
              </div>
            </div>
          </div>

          <div className="text-center text-gray-600 space-y-2">
            <p>• Aperte e segure as imagens para reposicionar</p>
            <p>• Use o canto inferior direito para redimensionar</p>
          </div>

          <div className="text-4xl flex gap-4 items-end justify-center flex-1 text-contrast [&>a]:hover:text-highlight [&>a]:transition-all">
            <a target="_blank" href="https://www.instagram.com/teethclub_">
              <FaInstagram />
            </a>
            <a target="_blank" href="https://api.whatsapp.com/send?phone=5527998555550">
              <FaWhatsapp />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ShirtDesigner;
