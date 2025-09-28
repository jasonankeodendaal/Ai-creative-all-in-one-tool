import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { UploadedImage } from './types.ts';
import { generateVideo } from './services/geminiService.ts';
import SparklesIcon from './components/icons/SparklesIcon.tsx';
import UploadIcon from './components/icons/UploadIcon.tsx';
import ImagePreview from './components/ImagePreview.tsx';
import LoadingIndicator from './components/LoadingIndicator.tsx';
import InfoIcon from './components/icons/InfoIcon.tsx';
import TrashIcon from './components/icons/TrashIcon.tsx';
import ApiKeyError from './components/ApiKeyError.tsx';

// Fix: Use Vite's standard `import.meta.env` for client-side environment variables.
const IS_API_KEY_SET = import.meta.env.VITE_API_KEY && import.meta.env.VITE_API_KEY.length > 0;

const MAX_IMAGES = 8;

// --- Video Style Customizer Options ---
const STYLE_ERAS = ['Modern', '1950s', '1960s Psychedelic', '1970s Earthy', '1980s Neon', '1990s Grunge', '2000s Y2K', 'Futuristic Sci-Fi'];
const STYLE_AUDIENCES = ['General', 'Kids', 'Teenagers', 'Young Adults', 'Professionals', 'Families', 'Seniors'];
const STYLE_MOODS = ['Energetic', 'Calm', 'Luxurious', 'Playful', 'Serious', 'Humorous', 'Mysterious', 'Nostalgic', 'Uplifting', 'Edgy', 'Dreamy', 'Authentic'];
const STYLE_TECHNIQUES = ['Fast Cuts', 'Slow Motion', 'Cinematic', 'Handheld/Documentary', 'Stop Motion', 'Typography Focus', 'Glitch Effects', 'Lens Flares', 'Split Screen', 'Black & White', 'Hand-drawn Animation', 'Minimalist'];
const STYLE_PALETTES = ['Vibrant & Saturated', 'Muted & Earthy', 'Pastel Colors', 'Monochrome (B&W)', 'High-Contrast', 'Neon Glow'];
const ASPECT_RATIOS = [
    { id: '16:9', name: 'Landscape', description: 'For YouTube, TV' },
    { id: '1:1', name: 'Square', description: 'For Instagram Feed' },
    { id: '9:16', name: 'Portrait', description: 'For Stories, Reels' }
];
const VIDEO_DURATIONS = [
    { id: '15 seconds', name: '15s' },
    { id: '30 seconds', name: '30s' },
    { id: '60 seconds', name: '60s' },
    { id: '3 minutes', name: '3 Min' },
];

const AspectRatioIcon: React.FC<{ ratio: string }> = ({ ratio }) => {
    const common = { width: "100%", height: "100%", viewBox: "0 0 32 32", fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as 'round', strokeLinejoin: 'round' as 'round' };
    switch (ratio) {
        case '16:9': return <svg {...common}><rect x="2" y="8" width="28" height="16" rx="2" /></svg>;
        case '1:1': return <svg {...common}><rect x="6" y="6" width="20" height="20" rx="2" /></svg>;
        case '9:16': return <svg {...common}><rect x="8" y="2" width="16" height="28" rx="2" /></svg>;
        default: return null;
    }
};

// --- New Image Ad Style Options ---
const LayoutIcon: React.FC<{ layout: string }> = ({ layout }) => {
    const common = { width: "100%", height: "100%", viewBox: "0 0 100 100", fill: 'none', stroke: 'currentColor', strokeWidth: 3, strokeLinecap: 'round' as 'round', strokeLinejoin: 'round' as 'round' };
    const rectFill = 'rgba(128, 128, 128, 0.3)';
    switch (layout) {
        case 'bottom-banner': return (
            <svg {...common}>
                <rect x="5" y="5" width="90" height="90" />
                <rect x="5" y="80" width="90" height="15" fill={rectFill} />
                <line x1="15" y1="87.5" x2="50" y2="87.5" stroke="currentColor" strokeWidth="2" />
                <line x1="65" y1="87.5" x2="85" y2="87.5" stroke="currentColor" strokeWidth="2" />
            </svg>
        );
        case 'top-banner': return (
            <svg {...common}>
                <rect x="5" y="5" width="90" height="90" />
                <rect x="5" y="5" width="90" height="15" fill={rectFill} />
                <line x1="15" y1="12.5" x2="50" y2="12.5" stroke="currentColor" strokeWidth="2" />
                <line x1="65" y1="12.5" x2="85" y2="12.5" stroke="currentColor" strokeWidth="2" />
            </svg>
        );
        case 'corner-box': return (
             <svg {...common}>
                <rect x="5" y="5" width="90" height="90" />
                <rect x="10" y="65" width="45" height="30" fill={rectFill} />
                <line x1="18" y1="75" x2="48" y2="75" stroke="currentColor" strokeWidth="2" />
                <line x1="18" y1="85" x2="48" y2="85" stroke="currentColor" strokeWidth="2" />
            </svg>
        );
        case 'split-left': return (
            <svg {...common}>
                <rect x="5" y="5" width="90" height="90" />
                <rect x="5" y="5" width="40" height="90" fill={rectFill} />
                <line x1="15" y1="40" x2="35" y2="40" stroke="currentColor" strokeWidth="2" />
                <line x1="15" y1="50" x2="35" y2="50" stroke="currentColor" strokeWidth="2" />
                <line x1="15" y1="60" x2="35" y2="60" stroke="currentColor" strokeWidth="2" />
            </svg>
        );
        case 'split-vertical': return (
            <svg {...common}>
                <rect x="5" y="5" width="90" height="90" />
                <rect x="5" y="63" width="90" height="32" fill={rectFill} />
                <line x1="30" y1="75" x2="70" y2="75" stroke="currentColor" strokeWidth="2" />
                <line x1="35" y1="85" x2="65" y2="85" stroke="currentColor" strokeWidth="2" />
            </svg>
        );
        case 'overlap': return (
            <svg {...common}>
                <rect x="5" y="5" width="90" height="90" />
                <rect x="18" y="58" width="64" height="24" fill={rectFill} stroke="currentColor" strokeWidth="1" />
                <line x1="30" y1="66" x2="70" y2="66" stroke="currentColor" strokeWidth="2" />
                <line x1="35" y1="74" x2="65" y2="74" stroke="currentColor" strokeWidth="2" />
            </svg>
        );
        case 'header-2col': return (
            <svg {...common}>
                <rect x="5" y="5" width="90" height="90" />
                <rect x="5" y="5" width="90" height="20" fill={rectFill} />
                <line x1="30" y1="15" x2="70" y2="15" stroke="currentColor" strokeWidth="2" />
                <line x1="15" y1="45" x2="45" y2="45" stroke="currentColor" strokeWidth="2" />
                <line x1="55" y1="45" x2="85" y2="45" stroke="currentColor" strokeWidth="2" />
                <line x1="15" y1="60" x2="45" y2="60" stroke="currentColor" strokeWidth="1.5" />
                <line x1="55" y1="60" x2="85" y2="60" stroke="currentColor" strokeWidth="1.5" />
            </svg>
        );
        default: return null;
    }
};

const IMAGE_AD_LAYOUTS = [
    { id: 'bottom-banner', name: 'Bottom Banner' }, { id: 'top-banner', name: 'Top Banner' },
    { id: 'corner-box', name: 'Corner Box' }, { id: 'split-left', name: 'Split Left' },
    { id: 'split-vertical', name: 'Split Vertical' }, { id: 'overlap', name: 'Overlap' },
    { id: 'header-2col', name: 'Header & 2 Col' }
];
const FONT_FAMILIES = ['Helvetica, sans-serif', 'Arial, sans-serif', 'Georgia, serif', 'Times New Roman, serif', 'Courier New, monospace', 'Impact, fantasy', '"Brush Script MT", cursive', 'Palatino, serif', 'Garamond, serif', '"Trebuchet MS", sans-serif'];
const IMAGE_FILTERS = [
    { id: 'none', name: 'None' }, { id: 'grayscale', name: 'Grayscale' },
    { id: 'sepia', name: 'Sepia' }, { id: 'invert', name: 'Invert' },
    { id: 'blur', name: 'Slight Blur' }, { id: 'duotone', name: 'Duotone' }
];
const TEXT_EFFECTS = [ {id: 'none', name: 'None'}, {id: 'shadow', name: 'Drop Shadow'}, {id: '3d', name: '3D Extrude'}, {id: 'outline', name: 'Outline'}, {id: 'glow', name: 'Glow'} ];
const FRAME_EFFECTS = [ {id: 'none', name: 'None'}, {id: '3d-perspective', name: '3D Perspective'} ];
const TEXT_TRANSFORMS = [{id: 'none', name: 'Normal'}, {id: 'uppercase', name: 'UPPERCASE'}, {id: 'lowercase', name: 'lowercase'}, {id: 'capitalize', name: 'Capitalize'}];


interface ImageAdStyle {
    layout: string | null;
    fontFamily: string;
    fontColor: string;
    fontWeight: string;
    textTransform: string;
    letterSpacing: number;
    textEffect: string;
    backgroundColor: string;
    backgroundOpacity: number;
    useGradient: boolean;
    backgroundGradientStart: string;
    backgroundGradientEnd: string;
    imageFilter: string;
    brightness: number;
    contrast: number;
    saturate: number;
    duotoneColor1: string;
    duotoneColor2: string;
    borderColor: string;
    borderWidth: number;
    frameEffect: string;
    padding: {
        top: number;
        right: number;
        bottom: number;
        left: number;
    };
}

const compositeImageWithLogo = (baseImageFile: File, logoFile: File): Promise<File> => {
    return new Promise((resolve, reject) => {
        const baseImage = new Image();
        const logoImage = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            return reject(new Error('Failed to get canvas context'));
        }

        const baseReader = new FileReader();
        baseReader.onload = (e) => { baseImage.src = e.target?.result as string; };
        baseReader.onerror = reject;
        baseReader.readAsDataURL(baseImageFile);

        const logoReader = new FileReader();
        logoReader.onload = (e) => { logoImage.src = e.target?.result as string; };
        logoReader.onerror = reject;
        logoReader.readAsDataURL(logoFile);

        baseImage.onload = () => {
            logoImage.onload = () => {
                canvas.width = baseImage.width;
                canvas.height = baseImage.height;
                ctx.drawImage(baseImage, 0, 0);

                const logoMaxWidth = baseImage.width * 0.2;
                const scale = Math.min(1, logoMaxWidth / logoImage.width);
                const logoWidth = logoImage.width * scale;
                const logoHeight = logoImage.height * scale;
                
                const padding = baseImage.width * 0.025;
                const x = baseImage.width - logoWidth - padding;
                const y = baseImage.height - logoHeight - padding;

                ctx.drawImage(logoImage, x, y, logoWidth, logoHeight);

                canvas.toBlob((blob) => {
                    if (blob) {
                        const newFile = new File([blob], baseImageFile.name, { type: baseImageFile.type });
                        resolve(newFile);
                    } else {
                        reject(new Error('Canvas toBlob failed'));
                    }
                }, baseImageFile.type, 0.95);
            };
        };
    });
};

const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const applyDuotone = (ctx: CanvasRenderingContext2D, W: number, H: number, color1: string, color2: string) => {
    const imageData = ctx.getImageData(0, 0, W, H);
    const data = imageData.data;
    const c1 = { r: parseInt(color1.slice(1,3), 16), g: parseInt(color1.slice(3,5), 16), b: parseInt(color1.slice(5,7), 16) };
    const c2 = { r: parseInt(color2.slice(1,3), 16), g: parseInt(color2.slice(3,5), 16), b: parseInt(color2.slice(5,7), 16) };

    for (let i = 0; i < data.length; i += 4) {
        const luminance = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        const normalized = luminance / 255;
        data[i] = c1.r + (c2.r - c1.r) * normalized;
        data[i+1] = c1.g + (c2.g - c1.g) * normalized;
        data[i+2] = c1.b + (c2.b - c1.b) * normalized;
    }
    ctx.putImageData(imageData, 0, 0);
}

const drawTextWithEffect = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, style: ImageAdStyle, scaleFactor: number = 1) => {
    ctx.textBaseline = 'middle';
    ctx.fillStyle = style.fontColor;
    ctx.strokeStyle = '#000000'; // Default outline color

    const transformedText = style.textTransform === 'none' ? text : text[style.textTransform]();
    ctx.letterSpacing = `${style.letterSpacing * scaleFactor}px`;

    if (style.textEffect === 'shadow') {
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 5 * scaleFactor;
        ctx.shadowOffsetX = 2 * scaleFactor;
        ctx.shadowOffsetY = 2 * scaleFactor;
        ctx.fillText(transformedText, x, y);
        ctx.shadowColor = 'transparent'; // Reset
    } else if (style.textEffect === '3d') {
        const offset = 2 * scaleFactor;
        ctx.fillStyle = '#333';
        ctx.fillText(transformedText, x + offset, y + offset);
        ctx.fillStyle = '#555';
        ctx.fillText(transformedText, x + offset / 2, y + offset / 2);
        ctx.fillStyle = style.fontColor;
        ctx.fillText(transformedText, x, y);
    } else if (style.textEffect === 'outline') {
        ctx.lineWidth = 2 * scaleFactor;
        ctx.strokeText(transformedText, x, y);
        ctx.fillText(transformedText, x, y);
    } else if (style.textEffect === 'glow') {
        ctx.shadowColor = style.fontColor;
        ctx.shadowBlur = 10 * scaleFactor;
        ctx.fillText(transformedText, x, y); // Multiple draws for stronger glow
        ctx.fillText(transformedText, x, y);
        ctx.shadowColor = 'transparent';
    } else {
        ctx.fillText(transformedText, x, y);
    }
    ctx.letterSpacing = '0px'; // Reset
}

const generateImageAd = async (
    baseImageFile: File, 
    logoFile: File | null, 
    details: { companyName: string, tel: string, email: string },
    style: ImageAdStyle,
    scaleFactor: number = 1,
    addPrintMarks: boolean = false
): Promise<HTMLCanvasElement> => {
    return new Promise((resolve, reject) => {
        const baseImage = new Image();
        const logoImage = logoFile ? new Image() : null;
       
        let loadedImages = 0;
        const totalImages = logoFile ? 2 : 1;

        const onImageLoad = () => {
            loadedImages++;
            if (loadedImages === totalImages) {
                drawCanvas();
            }
        };

        baseImage.onload = onImageLoad;
        baseImage.onerror = () => reject(new Error('Failed to load base image'));
        baseImage.src = URL.createObjectURL(baseImageFile);

        if (logoImage && logoFile) {
            logoImage.onload = onImageLoad;
            logoImage.onerror = () => reject(new Error('Failed to load logo image'));
            logoImage.src = URL.createObjectURL(logoFile);
        }

        const drawCanvas = () => {
            const bleed = addPrintMarks ? 37.5 * scaleFactor : 0; // 0.125 inches at 300dpi
            const canvas = document.createElement('canvas');
            const W = baseImage.width * scaleFactor;
            const H = baseImage.height * scaleFactor;
            canvas.width = W + bleed * 2;
            canvas.height = H + bleed * 2;
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject(new Error('Failed to get canvas context'));

            ctx.save();
            ctx.translate(bleed, bleed);
            
            // Apply image filter
            ctx.save();
            const filters = [];
            if (style.imageFilter === 'grayscale') filters.push('grayscale(100%)');
            if (style.imageFilter === 'sepia') filters.push('sepia(100%)');
            if (style.imageFilter === 'invert') filters.push('invert(100%)');
            if (style.imageFilter === 'blur') filters.push(`blur(${5 * scaleFactor}px)`);
            filters.push(`brightness(${style.brightness}%)`);
            filters.push(`contrast(${style.contrast}%)`);
            filters.push(`saturate(${style.saturate}%)`);
            
            ctx.filter = filters.join(' ');
            ctx.drawImage(baseImage, 0, 0, W, H);

            if (style.imageFilter === 'duotone') {
                applyDuotone(ctx, W, H, style.duotoneColor1, style.duotoneColor2);
            }
            ctx.restore();
            
            const paddingTop = H * (style.padding.top / 100);
            const paddingRight = W * (style.padding.right / 100);
            const paddingBottom = H * (style.padding.bottom / 100);
            const paddingLeft = W * (style.padding.left / 100);

            const contactText = [details.tel, details.email].filter(Boolean).join(' | ');
            if (style.useGradient) {
                const gradient = ctx.createLinearGradient(0, 0, W, H);
                gradient.addColorStop(0, hexToRgba(style.backgroundGradientStart, style.backgroundOpacity));
                gradient.addColorStop(1, hexToRgba(style.backgroundGradientEnd, style.backgroundOpacity));
                ctx.fillStyle = gradient;
            } else {
                ctx.fillStyle = hexToRgba(style.backgroundColor, style.backgroundOpacity);
            }
            
            // A much more complex layout engine
            switch (style.layout) {
                case 'bottom-banner': {
                    const barHeight = H * 0.15;
                    ctx.fillRect(0, H - barHeight, W, barHeight);
                    const companyFontSize = barHeight * 0.3;
                    ctx.font = `${style.fontWeight} ${companyFontSize}px ${style.fontFamily}`;
                    ctx.textAlign = 'left';
                    drawTextWithEffect(ctx, details.companyName, paddingLeft, H - barHeight / 2, style, scaleFactor);
                    const contactFontSize = barHeight * 0.2;
                    ctx.font = `${style.fontWeight} ${contactFontSize}px ${style.fontFamily}`;
                    const textWidth = ctx.measureText(contactText).width;
                    ctx.textAlign = 'right';
                    drawTextWithEffect(ctx, contactText, W - paddingRight, H - barHeight / 2, style, scaleFactor);
                    break;
                }
                case 'top-banner': {
                    const barHeight = H * 0.15;
                    ctx.fillRect(0, 0, W, barHeight);
                    const companyFontSize = barHeight * 0.3;
                    ctx.font = `${style.fontWeight} ${companyFontSize}px ${style.fontFamily}`;
                    ctx.textAlign = 'left';
                    drawTextWithEffect(ctx, details.companyName, paddingLeft, barHeight / 2, style, scaleFactor);
                    const contactFontSize = barHeight * 0.2;
                    ctx.font = `${style.fontWeight} ${contactFontSize}px ${style.fontFamily}`;
                    const textWidth = ctx.measureText(contactText).width;
                    ctx.textAlign = 'right';
                    drawTextWithEffect(ctx, contactText, W - paddingRight, barHeight / 2, style, scaleFactor);
                    break;
                }
                 case 'split-vertical': {
                    const barHeight = H * 0.35;
                    ctx.fillRect(0, H - barHeight, W, barHeight);
                    ctx.textAlign = 'center';
                    const companyFontSize = barHeight * 0.25;
                     ctx.font = `${style.fontWeight} ${companyFontSize}px ${style.fontFamily}`;
                    const availableHeight = barHeight - paddingTop - paddingBottom;
                    drawTextWithEffect(ctx, details.companyName, W/2, (H - barHeight) + paddingTop + availableHeight * 0.3, style, scaleFactor);
                    const contactFontSize = barHeight * 0.15;
                     ctx.font = `${style.fontWeight} ${contactFontSize}px ${style.fontFamily}`;
                    drawTextWithEffect(ctx, contactText, W/2, (H - barHeight) + paddingTop + availableHeight * 0.7, style, scaleFactor);
                    break;
                }
                case 'overlap': {
                    const boxW = W * 0.7;
                    const boxH = H * 0.25;
                    const boxX = (W - boxW) / 2;
                    const boxY = H * 0.65;
                    ctx.fillRect(boxX, boxY, boxW, boxH);
                    if (style.borderWidth > 0) {
                        ctx.strokeStyle = style.borderColor;
                        ctx.lineWidth = (style.borderWidth/2) * (W / 1000) * scaleFactor;
                        ctx.strokeRect(boxX, boxY, boxW, boxH);
                    }
                    ctx.textAlign = 'center';
                    const availableHeight = boxH - paddingTop - paddingBottom;
                    const companyFontSize = boxH * 0.3;
                    ctx.font = `${style.fontWeight} ${companyFontSize}px ${style.fontFamily}`;
                    drawTextWithEffect(ctx, details.companyName, W/2, boxY + paddingTop + availableHeight * 0.35, style, scaleFactor);
                    const contactFontSize = boxH * 0.2;
                    ctx.font = `${style.fontWeight} ${contactFontSize}px ${style.fontFamily}`;
                    drawTextWithEffect(ctx, contactText, W/2, boxY + paddingTop + availableHeight * 0.7, style, scaleFactor);
                    break;
                }
                case 'header-2col': {
                    const barHeight = H * 0.2;
                    ctx.fillRect(0, 0, W, barHeight);
                    ctx.textAlign = 'center';
                    const companyFontSize = barHeight * 0.4;
                    ctx.font = `${style.fontWeight} ${companyFontSize}px ${style.fontFamily}`;
                    const availableHeaderHeight = barHeight - paddingTop - paddingBottom;
                    drawTextWithEffect(ctx, details.companyName, W/2, paddingTop + availableHeaderHeight / 2, style, scaleFactor);
                    
                    ctx.textAlign = 'left';
                    const contactFontSize = H * 0.05;
                    ctx.font = `${style.fontWeight} ${contactFontSize}px ${style.fontFamily}`;
                    const contentY = barHeight + paddingTop;
                    if(details.tel) drawTextWithEffect(ctx, `Tel: ${details.tel}`, paddingLeft, contentY, style, scaleFactor);
                    if(details.email) drawTextWithEffect(ctx, `Email: ${details.email}`, W/2 + paddingLeft, contentY, style, scaleFactor);
                    break;
                }
                // Add more cases here for other layouts...
                default: { // Fallback for unimplemented or simple layouts
                    const barHeight = H * 0.15;
                    ctx.fillRect(0, H - barHeight, W, barHeight);
                    ctx.font = `bold ${barHeight * 0.3}px ${style.fontFamily}`;
                    ctx.textAlign = 'left';
                    drawTextWithEffect(ctx, details.companyName, paddingLeft, H - barHeight / 2, style, scaleFactor);
                }
            }


            if (logoImage) {
                 const logoMax = W * 0.15;
                 const scale = Math.min(1, logoMax / logoImage.width, (H * 0.15) / logoImage.height);
                 const logoWidth = logoImage.width * scale;
                 const logoHeight = logoImage.height * scale;
                 ctx.drawImage(logoImage, W - logoWidth - paddingRight, paddingTop, logoWidth, logoHeight);
            }
            
            if (style.borderWidth > 0) {
                ctx.strokeStyle = style.borderColor;
                ctx.lineWidth = style.borderWidth * (W / 1000) * scaleFactor;
                ctx.strokeRect(0, 0, W, H);
            }
            ctx.restore();

            if (addPrintMarks) {
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 1 * scaleFactor;
                const markLength = bleed * 0.6;
                // Top-left
                ctx.beginPath(); ctx.moveTo(0, bleed); ctx.lineTo(markLength, bleed); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(bleed, 0); ctx.lineTo(bleed, markLength); ctx.stroke();
                // Top-right
                ctx.beginPath(); ctx.moveTo(canvas.width - markLength, bleed); ctx.lineTo(canvas.width, bleed); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(canvas.width - bleed, 0); ctx.lineTo(canvas.width - bleed, markLength); ctx.stroke();
                // Bottom-left
                ctx.beginPath(); ctx.moveTo(0, canvas.height - bleed); ctx.lineTo(markLength, canvas.height - bleed); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(bleed, canvas.height - markLength); ctx.lineTo(bleed, canvas.height); ctx.stroke();
                // Bottom-right
                ctx.beginPath(); ctx.moveTo(canvas.width - markLength, canvas.height - bleed); ctx.lineTo(canvas.width, canvas.height - bleed); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(canvas.width - bleed, canvas.height - markLength); ctx.lineTo(canvas.width - bleed, canvas.height); ctx.stroke();
            }

            resolve(canvas);
        };
    });
};

const fileToBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
});


const generateImageAdSVG = async (
    baseImageFile: File,
    logoFile: File | null,
    details: { companyName: string, tel: string, email: string },
    style: ImageAdStyle
): Promise<string> => {
    const baseImage = new Image();
    baseImage.src = await fileToBase64(baseImageFile);
    const logoImage = logoFile ? new Image() : null;
    if (logoImage && logoFile) {
        logoImage.src = await fileToBase64(logoFile);
    }

    return new Promise(resolve => {
        baseImage.onload = () => {
             const finalRender = () => {
                const { width, height } = baseImage;
                const paddingTop = height * (style.padding.top / 100);
                const paddingRight = width * (style.padding.right / 100);
                const paddingBottom = height * (style.padding.bottom / 100);
                const paddingLeft = width * (style.padding.left / 100);

                const contactText = [details.tel, details.email].filter(Boolean).join(' | ');
                 const transformedCompanyName = style.textTransform === 'none' ? details.companyName : details.companyName[style.textTransform]();
                
                 let imageFilterUrl = '';
                const filters = [];
                if (style.imageFilter === 'grayscale') filters.push('grayscale(1)');
                if (style.imageFilter === 'sepia') filters.push('sepia(1)');
                if (style.imageFilter === 'invert') filters.push('invert(1)');
                if (style.imageFilter === 'blur') filters.push(`blur(5px)`);
                filters.push(`brightness(${style.brightness/100})`);
                filters.push(`contrast(${style.contrast/100})`);
                filters.push(`saturate(${style.saturate/100})`);
                const imageCssFilter = filters.join(' ');
                 
                let duotoneFilterDef = '';
                if(style.imageFilter === 'duotone') {
                    imageFilterUrl = 'url(#duotone)';
                    const c1 = { r: parseInt(style.duotoneColor1.slice(1,3), 16)/255, g: parseInt(style.duotoneColor1.slice(3,5), 16)/255, b: parseInt(style.duotoneColor1.slice(5,7), 16)/255 };
                    const c2 = { r: parseInt(style.duotoneColor2.slice(1,3), 16)/255, g: parseInt(style.duotoneColor2.slice(3,5), 16)/255, b: parseInt(style.duotoneColor2.slice(5,7), 16)/255 };
                    duotoneFilterDef = `
                        <filter id="duotone">
                          <feColorMatrix type="matrix" result="grayscale" values="0.299 0.587 0.114 0 0 0.299 0.587 0.114 0 0 0.299 0.587 0.114 0 0 0 0 0 1 0" />
                          <feComponentTransfer color-interpolation-filters="sRGB" result="duotone">
                            <feFuncR type="table" tableValues="${c1.r} ${c2.r}" />
                            <feFuncG type="table" tableValues="${c1.g} ${c2.g}" />
                            <feFuncB type="table" tableValues="${c1.b} ${c2.b}" />
                          </feComponentTransfer>
                        </filter>
                    `;
                }

                const filterDefs = `
                    ${duotoneFilterDef}
                    <filter id="text-shadow"><feDropShadow dx="2" dy="2" stdDeviation="3" flood-color="rgba(0,0,0,0.5)"/></filter>
                    <filter id="text-glow"><feDropShadow dx="0" dy="0" stdDeviation="5" flood-color="${style.fontColor}"/></filter>
                `;
                 
                let backgroundElement = '';
                let gradientDef = '';
                if (style.useGradient) {
                    gradientDef = `<linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${style.backgroundGradientStart}" stop-opacity="${style.backgroundOpacity}"/><stop offset="100%" stop-color="${style.backgroundGradientEnd}" stop-opacity="${style.backgroundOpacity}"/></linearGradient>`;
                    backgroundElement = `<rect x="0" y="0" width="${width}" height="${height}" fill="url(#bgGradient)" />`;
                } else {
                    backgroundElement = `<rect x="0" y="0" width="${width}" height="${height}" fill="${style.backgroundColor}" fill-opacity="${style.backgroundOpacity}" />`;
                }
                 
                let layoutElements = '';
                const textFilter = style.textEffect === 'shadow' ? 'filter="url(#text-shadow)"' : (style.textEffect === 'glow' ? 'filter="url(#text-glow)"' : '');
                const textStroke = style.textEffect === 'outline' ? `stroke="#000" stroke-width="2"` : '';
                const commonTextStyles = `font-family="${style.fontFamily}" fill="${style.fontColor}" font-weight="${style.fontWeight}" letter-spacing="${style.letterSpacing}" text-transform="${style.textTransform === 'none' ? 'none' : style.textTransform}"`;

                if(style.layout === 'bottom-banner'){
                    const barHeight = height * 0.15;
                    const companyFontSize = barHeight * 0.3;
                    const contactFontSize = barHeight * 0.2;
                    const yPos = height - barHeight / 2;
                    layoutElements = `
                        <rect x="0" y="${height - barHeight}" width="${width}" height="${barHeight}" fill="${style.backgroundColor}" fill-opacity="${style.backgroundOpacity}" />
                        <text x="${paddingLeft}" y="${yPos}" alignment-baseline="middle" font-size="${companyFontSize}" ${commonTextStyles} ${textFilter} ${textStroke}>${transformedCompanyName}</text>
                        <text x="${width - paddingRight}" y="${yPos}" text-anchor="end" alignment-baseline="middle" font-size="${contactFontSize}" ${commonTextStyles} ${textFilter} ${textStroke}>${contactText}</text>
                    `;
                }
                
                let logoElement = '';
                if(logoImage) {
                     const logoMax = width * 0.15;
                     const scale = Math.min(1, logoMax / logoImage.width, (height * 0.15) / logoImage.height);
                     const logoWidth = logoImage.width * scale;
                     const logoHeight = logoImage.height * scale;
                     logoElement = `<image href="${logoImage.src}" x="${width - logoWidth - paddingRight}" y="${paddingTop}" width="${logoWidth}" height="${logoHeight}" />`;
                }

                const borderElement = style.borderWidth > 0 ? `<rect x="0" y="0" width="${width}" height="${height}" fill="none" stroke="${style.borderColor}" stroke-width="${style.borderWidth * (width/1000)}" />` : '';

                const baseImageElement = `<image href="${baseImage.src}" x="0" y="0" width="${width}" height="${height}" style="filter: ${imageCssFilter};" filter="${imageFilterUrl}" />`;

                const svgString = `
                    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                        <defs>${gradientDef}${filterDefs}</defs>
                        ${baseImageElement}
                        ${layoutElements.includes('<rect') ? '' : backgroundElement}
                        ${layoutElements}
                        ${logoElement}
                        ${borderElement}
                    </svg>
                `;
                resolve(svgString);
            };
            
            if (logoImage) {
                logoImage.onload = finalRender;
            } else {
                finalRender();
            }
        };
    });
};

const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

const loadScript = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
            return resolve();
        }
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
        document.head.appendChild(script);
    });
};

const extractTextFromPdf = async (file: File): Promise<string> => {
  const { pdfjsLib } = (window as any);
  if (!pdfjsLib) throw new Error('PDF library not loaded.');

  const fileReader = new FileReader();
  return new Promise((resolve, reject) => {
    fileReader.onload = async (event) => {
      try {
        const typedArray = new Uint8Array(event.target!.result as ArrayBuffer);
        const pdf = await pdfjsLib.getDocument(typedArray).promise;
        const numPages = pdf.numPages;
        let fullText = '';

        for (let i = 1; i <= numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(' ');
          fullText += pageText + '\n\n'; // Add separator between pages
        }
        resolve(fullText);
      } catch (error) {
        reject(error);
      }
    };
    fileReader.onerror = reject;
    fileReader.readAsArrayBuffer(file);
  });
};

const Accordion: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="border border-gray-700 rounded-lg overflow-hidden transition-all duration-300">
            <button 
                onClick={() => setIsOpen(!isOpen)} 
                className="w-full flex justify-between items-center p-4 bg-gray-700/50 hover:bg-gray-700 transition-colors"
                aria-expanded={isOpen}
            >
                <h3 className="text-md font-semibold text-gray-300">{title}</h3>
                <svg className={`w-5 h-5 transform transition-transform text-gray-400 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>
            {isOpen && <div className="p-4 bg-gray-800/50 space-y-4">{children}</div>}
        </div>
    );
};


const App: React.FC = () => {
  // If the API key isn't set, render an error screen immediately.
  if (!IS_API_KEY_SET) {
    return <ApiKeyError />;
  }

  const [mode, setMode] = useState<'video' | 'image'>('video');
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [logo, setLogo] = useState<UploadedImage | null>(null);
  
  const [styleEra, setStyleEra] = useState<string>(STYLE_ERAS[0]);
  const [styleAudience, setStyleAudience] = useState<string>(STYLE_AUDIENCES[0]);
  const [styleMoods, setStyleMoods] = useState<string[]>([]);
  const [styleTechniques, setStyleTechniques] = useState<string[]>([]);
  const [stylePalette, setStylePalette] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<string>(ASPECT_RATIOS[0].id);
  const [videoDuration, setVideoDuration] = useState<string | null>(null);

  const [imageAdStyle, setImageAdStyle] = useState<ImageAdStyle>({
    layout: null, fontFamily: 'Helvetica, sans-serif', fontColor: '#FFFFFF',
    fontWeight: 'normal', textTransform: 'none', letterSpacing: 0,
    textEffect: 'none', backgroundColor: '#000000', backgroundOpacity: 0.7, 
    useGradient: false, backgroundGradientStart: '#000000', backgroundGradientEnd: '#4B0082',
    imageFilter: 'none', brightness: 100, contrast: 100, saturate: 100,
    duotoneColor1: '#0000FF', duotoneColor2: '#FFFF00',
    borderColor: '#FFFFFF', borderWidth: 0, frameEffect: 'none',
    padding: { top: 4, right: 4, bottom: 4, left: 4 }
  });
  
  const [companyName, setCompanyName] = useState('');
  const [tel, setTel] = useState('');
  const [email, setEmail] = useState('');
  const [companyBible, setCompanyBible] = useState<File | null>(null);
  const [bibleGuidelines, setBibleGuidelines] = useState<string | null>(null);
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);
  const [showBibleGuidelines, setShowBibleGuidelines] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [generatedCanvas, setGeneratedCanvas] = useState<HTMLCanvasElement | null>(null);

  const [scriptsLoaded, setScriptsLoaded] = useState({ jspdf: false, jszip: false, pdfjs: false });
  const generatedCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    Promise.all([
        loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js').then(() => setScriptsLoaded(s => ({...s, jspdf: true}))),
        loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js').then(() => setScriptsLoaded(s => ({...s, jszip: true}))),
        loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js').then(() => {
            (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
            setScriptsLoaded(s => ({...s, pdfjs: true}));
        })
    ]).catch(err => console.error(err));
  }, []);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
        const files = Array.from(event.target.files);
        if (mode === 'image' && files.length > 0) {
            const file = files[0];
            setUploadedImages([{ file, previewUrl: URL.createObjectURL(file) }]);
        } else {
            const newImages = files.map((file) => ({ file, previewUrl: URL.createObjectURL(file) }));
            setUploadedImages((prev) => [...prev, ...newImages].slice(0, MAX_IMAGES));
        }
    }
  };
  
  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
        const file = event.target.files[0];
        setLogo({ file, previewUrl: URL.createObjectURL(file) });
    }
  };

  const handleBibleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
        const file = event.target.files[0];
        setCompanyBible(file);
        setIsProcessingPdf(true);
        setError(null);
        try {
            const text = await extractTextFromPdf(file);
            setBibleGuidelines(text);
        } catch (error) {
            console.error(error);
            setError("Failed to process the PDF file. It might be corrupted or in an unsupported format.");
            setCompanyBible(null);
            setBibleGuidelines(null);
        } finally {
            setIsProcessingPdf(false);
        }
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };
  const removeLogo = () => setLogo(null);
  const removeBible = () => {
    setCompanyBible(null);
    setBibleGuidelines(null);
  }

  const handleGenerateVideoClick = useCallback(async () => {
    if (uploadedImages.length === 0 || !videoDuration) return;

    setIsLoading(true);
    setError(null);
    setGeneratedVideoUrl(null);

    // Build the style prompt
    let prompt = `Create a ${styleEra} style video ad.`;
    if (styleAudience !== 'General') {
        prompt += ` The target audience is ${styleAudience}.`;
    }
    if (styleMoods.length > 0) {
        prompt += ` The mood should be ${styleMoods.join(', ')}.`;
    }
    if (styleTechniques.length > 0) {
        prompt += ` Use visual techniques like ${styleTechniques.join(', ')}.`;
    }
    if (stylePalette) {
        prompt += ` The color palette should be ${stylePalette}.`;
    }

    try {
        let imagesToProcess: UploadedImage[] = [...uploadedImages];
        const logoWasAdded = !!logo;
        // The VEO model uses the logo as a "reference image" so we composite it client-side.
        if (logo && uploadedImages.length > 0) {
            const compositedFile = await compositeImageWithLogo(uploadedImages[0].file, logo.file);
            const firstImageWithLogo = { ...uploadedImages[0], file: compositedFile };
            imagesToProcess = [firstImageWithLogo, ...uploadedImages.slice(1)];
        }
        
        const videoUrl = await generateVideo(
            prompt,
            { companyName, tel, email },
            imagesToProcess,
            logoWasAdded,
            videoDuration,
            bibleGuidelines || undefined,
            aspectRatio
        );
        setGeneratedVideoUrl(videoUrl);
    } catch (err: any) {
        setError(err.message || 'An unexpected error occurred during video generation.');
    } finally {
        setIsLoading(false);
    }
  }, [styleEra, styleAudience, styleMoods, styleTechniques, stylePalette, companyName, tel, email, uploadedImages, logo, bibleGuidelines, aspectRatio, videoDuration]);

  const handleGenerateImageClick = useCallback(async () => {
    if (!imageAdStyle.layout || uploadedImages.length === 0) return;
    setIsLoading(true);
    setError(null);
    setGeneratedCanvas(null);
    generatedCanvasRef.current = null;

    try {
        const canvas = await generateImageAd(
            uploadedImages[0].file, logo?.file || null, { companyName, tel, email }, imageAdStyle
        );
        setGeneratedCanvas(canvas);
        generatedCanvasRef.current = canvas;
    } catch (err: any) {
        setError(err.message || 'An unexpected error occurred.');
    } finally {
        setIsLoading(false);
    }
  }, [imageAdStyle, companyName, tel, email, uploadedImages, logo]);
  
  const handleDownload = useCallback(async (format: 'png' | 'jpg' | 'pdf' | 'pdf-print' | 'svg' | 'zip') => {
      const canvas = generatedCanvasRef.current;
      if (!canvas) return;

      const baseFilename = companyName.replace(/\s+/g, '-') || 'ad';
      setIsDownloading(true);

      try {
        if (format === 'png') {
            canvas.toBlob((blob) => triggerDownload(blob!, `${baseFilename}.png`), 'image/png');
        } else if (format === 'jpg') {
            canvas.toBlob((blob) => triggerDownload(blob!, `${baseFilename}.jpg`), 'image/jpeg', 0.9);
        } else if (format === 'svg') {
            const svgString = await generateImageAdSVG(uploadedImages[0].file, logo?.file || null, { companyName, tel, email }, imageAdStyle);
            const blob = new Blob([svgString], { type: 'image/svg+xml' });
            triggerDownload(blob, `${baseFilename}.svg`);
        } else if (format === 'pdf') {
            const { jsPDF } = (window as any).jspdf;
            const pdf = new jsPDF({ orientation: canvas.width > canvas.height ? 'l' : 'p', unit: 'px', format: [canvas.width, canvas.height] });
            pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save(`${baseFilename}.pdf`);
        } else if (format === 'pdf-print') {
            const printCanvas = await generateImageAd(uploadedImages[0].file, logo?.file || null, { companyName, tel, email }, imageAdStyle, 3, true);
            const { jsPDF } = (window as any).jspdf;
            const pdf = new jsPDF({ orientation: printCanvas.width > printCanvas.height ? 'l' : 'p', unit: 'px', format: [printCanvas.width, printCanvas.height] });
            pdf.addImage(printCanvas.toDataURL('image/png'), 'PNG', 0, 0, printCanvas.width, printCanvas.height);
            pdf.save(`${baseFilename}-print-ready.pdf`);
        } else if (format === 'zip') {
             const { JSZip } = (window as any);
             const zip = new JSZip();
             const canvasBlob = (type: 'image/png'|'image/jpeg') => new Promise<Blob>(res => canvas.toBlob(b => res(b!), type));
             zip.file(`${baseFilename}.png`, await canvasBlob('image/png'));
             zip.file(`${baseFilename}.jpg`, await canvasBlob('image/jpeg'));
             const svgString = await generateImageAdSVG(uploadedImages[0].file, logo?.file || null, { companyName, tel, email }, imageAdStyle);
             zip.file(`${baseFilename}.svg`, new Blob([svgString], { type: 'image/svg+xml' }));
             const content = await zip.generateAsync({ type: 'blob' });
             triggerDownload(content, `${baseFilename}-package.zip`);
        }
      } catch (err: any) {
          setError(err.message || 'Failed to generate download.');
      } finally {
          setIsDownloading(false);
      }
  }, [companyName, tel, email, imageAdStyle, uploadedImages, logo]);

  const handleReset = () => {
    setMode('video');
    setUploadedImages([]);
    setLogo(null); setCompanyBible(null); setBibleGuidelines(null);
    setStyleEra(STYLE_ERAS[0]); setStyleAudience(STYLE_AUDIENCES[0]); setStyleMoods([]); setStyleTechniques([]); setStylePalette(null); setAspectRatio(ASPECT_RATIOS[0].id); setVideoDuration(null);
    setImageAdStyle({ layout: null, fontFamily: 'Helvetica, sans-serif', fontColor: '#FFFFFF', fontWeight: 'normal', textTransform: 'none', letterSpacing: 0, textEffect: 'none', backgroundColor: '#000000', backgroundOpacity: 0.7, useGradient: false, backgroundGradientStart: '#000000', backgroundGradientEnd: '#4B0082', imageFilter: 'none', brightness: 100, contrast: 100, saturate: 100, duotoneColor1: '#0000FF', duotoneColor2: '#FFFF00', borderColor: '#FFFFFF', borderWidth: 0, frameEffect: 'none', padding: { top: 4, right: 4, bottom: 4, left: 4 } });
    setCompanyName(''); setTel(''); setEmail('');
    setIsLoading(false); setError(null);
    setGeneratedVideoUrl(null); setGeneratedCanvas(null); generatedCanvasRef.current = null;
  };
  
  const isGenerateDisabled = useMemo(() => {
    if (isLoading) return true;
    if (uploadedImages.length === 0 || companyName.trim().length === 0) return true;
    if (mode === 'video' && (styleMoods.length === 0 || !stylePalette || !videoDuration)) return true;
    if (mode === 'image' && !imageAdStyle.layout) return true;
    return false;
  }, [isLoading, uploadedImages.length, companyName, mode, styleMoods, stylePalette, imageAdStyle.layout, videoDuration]);

  const toggleMultiSelectItem = (item: string, list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, max: number) => {
    setList(prev => prev.includes(item) ? prev.filter(i => i !== item) : (prev.length < max ? [...prev, item] : prev));
  };
  
  const handleImageStyleChange = (prop: keyof ImageAdStyle, value: any) => {
    setImageAdStyle(prev => ({ ...prev, [prop]: value }));
  };

  const renderContent = () => {
    if (isLoading) return <LoadingIndicator />;
    
    if (error) return (
        <div className="text-center p-8 bg-red-900/50 rounded-lg">
            <h3 className="text-xl font-semibold text-red-400">An Error Occurred</h3>
            <p className="mt-2 text-gray-300 max-w-md mx-auto">{error}</p>
            <button onClick={handleReset} className="mt-6 px-6 py-2 bg-red-600 text-white font-bold rounded-full shadow-lg hover:bg-red-700 transition-colors">
                Try Again
            </button>
        </div>
    );

    if (generatedVideoUrl) return (
        <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
            <h2 className="text-2xl font-bold text-center mb-4 bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text">Your Video Ad is Ready!</h2>
            <video src={generatedVideoUrl} controls className="w-full rounded-lg shadow-2xl shadow-purple-900/50 border-2 border-purple-500" />
            <button onClick={handleReset} className="mt-8 px-8 py-3 bg-gray-600 text-white font-bold rounded-full shadow-lg hover:bg-gray-700 transform transition-colors duration-300 focus:outline-none focus:ring-4 focus:ring-gray-500">
                Create Another
            </button>
        </div>
    );

    if (generatedCanvas) {
      const downloadButtonClasses = "w-full sm:w-auto flex-grow text-center px-4 py-3 bg-gray-600 text-white font-bold rounded-lg shadow-md hover:bg-gray-500 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-wait transition-all duration-200";
      return (
        <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
            <h2 className="text-2xl font-bold text-center mb-4 bg-gradient-to-r from-cyan-400 to-blue-500 text-transparent bg-clip-text">Your Image Ad is Ready!</h2>
            <div style={imageAdStyle.frameEffect === '3d-perspective' ? { perspective: '1000px' } : {}}>
                <img 
                    src={generatedCanvas.toDataURL()} 
                    alt="Generated advertisement" 
                    className="w-full rounded-lg shadow-2xl shadow-blue-900/50 border-2 border-blue-500 transition-transform duration-500"
                    style={imageAdStyle.frameEffect === '3d-perspective' ? { transform: 'rotateY(-10deg) rotateX(5deg)' } : {}}
                />
            </div>
            
            <div className="w-full mt-8 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                <h3 className="text-lg font-semibold text-center mb-4">Download Options</h3>
                 {isDownloading && <p className="text-center text-sm text-cyan-400 mb-2">Preparing your file, please wait...</p>}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                    <button onClick={() => handleDownload('png')} disabled={isDownloading} className={downloadButtonClasses}>PNG</button>
                    <button onClick={() => handleDownload('jpg')} disabled={isDownloading} className={downloadButtonClasses}>JPG</button>
                    <button onClick={() => handleDownload('svg')} disabled={isDownloading} className={downloadButtonClasses}>SVG <span className="text-xs">(Vector)</span></button>
                    <button onClick={() => handleDownload('pdf')} disabled={isDownloading || !scriptsLoaded.jspdf} className={downloadButtonClasses}>PDF <span className="text-xs">(Web)</span></button>
                    <button onClick={() => handleDownload('pdf-print')} disabled={isDownloading || !scriptsLoaded.jspdf} className={downloadButtonClasses}>PDF <span className="text-xs">(Print)</span></button>
                </div>
                 <button onClick={() => handleDownload('zip')} disabled={isDownloading || !scriptsLoaded.jszip} className="w-full px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-full shadow-lg hover:scale-105 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-wait transform transition-transform duration-300 focus:outline-none focus:ring-4 focus:ring-blue-400">
                    Download All (.zip)
                </button>
            </div>
            
            <button onClick={handleReset} className="mt-8 px-8 py-3 bg-gray-600 text-white font-bold rounded-full shadow-lg hover:bg-gray-700 transform transition-colors duration-300 focus:outline-none focus:ring-4 focus:ring-gray-500">
              Create Another
            </button>
        </div>
      );
    }
    
    return (
        <div className="w-full space-y-8">
            <div>
              <h2 className="text-lg font-semibold text-gray-300 mb-2 block">1. Upload Your Assets</h2>
              <div className="relative border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-purple-500 transition-colors duration-300">
                  <UploadIcon className="mx-auto h-12 w-12 text-gray-500"/>
                  <p className="mt-2 text-gray-400">Drag & drop files or click to browse</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {mode === 'video' ? `Up to ${MAX_IMAGES} product images supported.` : `Upload one primary product image.`}
                  </p>
                  <input type="file" multiple={mode === 'video'} accept="image/*" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" disabled={(mode === 'video' && uploadedImages.length >= MAX_IMAGES) || (mode === 'image' && uploadedImages.length >= 1)} />
              </div>
            </div>
            {uploadedImages.length > 0 && <div className="flex flex-wrap gap-4">{uploadedImages.map((image, index) => (<ImagePreview key={index} image={image} onRemove={() => removeImage(index)} />))}</div>}

             <div>
                <h2 className="text-lg font-semibold text-gray-300 mb-2 block">2. Add Your Business Details</h2>
                <div className="space-y-4 p-4 bg-gray-900/30 rounded-lg border border-gray-700">
                    <input
                        type="text"
                        placeholder="Company Name (Required)"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <input
                            type="tel"
                            placeholder="Phone Number (Optional)"
                            value={tel}
                            onChange={(e) => setTel(e.target.value)}
                            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                        />
                        <input
                            type="email"
                            placeholder="Email Address (Optional)"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                        />
                    </div>
                    <div>
                        <label htmlFor="logo-upload" className="w-full flex items-center justify-center p-3 bg-gray-700 border border-gray-600 rounded-md cursor-pointer hover:bg-gray-600 transition-colors">
                            <UploadIcon className="w-5 h-5 mr-2 text-gray-400" />
                            <span className="text-sm text-gray-300">{logo ? `Logo: ${logo.file.name}` : 'Upload Logo (Optional)'}</span>
                        </label>
                        <input id="logo-upload" type="file" accept="image/png, image/jpeg" onChange={handleLogoChange} className="hidden" />
                        {logo && (
                            <div className="mt-4">
                                <ImagePreview image={logo} onRemove={removeLogo} />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div>
                <h2 className="text-lg font-semibold text-gray-300 mb-2 block">3. Upload Company Identity Bible (Optional)</h2>
                <div className="p-4 bg-purple-900/30 border border-purple-700 rounded-lg flex items-start gap-4">
                    <InfoIcon className="w-8 h-8 text-purple-400 flex-shrink-0 mt-1" />
                    <div>
                        <h3 className="font-semibold text-purple-300">Ensure Brand Consistency</h3>
                        <p className="text-sm text-purple-300/80 mt-1">Upload your brand identity PDF. The AI will use this to ensure your ads are 100% on-brand.</p>
                    </div>
                </div>
                <div className="mt-4">
                    {!companyBible ? (
                        <label htmlFor="bible-upload" className={`w-full flex items-center justify-center p-3 bg-gray-700 border border-gray-600 rounded-md transition-colors ${scriptsLoaded.pdfjs ? 'cursor-pointer hover:bg-gray-600' : 'cursor-not-allowed bg-gray-800'}`}>
                            <UploadIcon className="w-5 h-5 mr-2 text-gray-400" />
                            <span className="text-sm text-gray-300">{scriptsLoaded.pdfjs ? 'Upload Identity PDF' : 'PDF Library Loading...'}</span>
                        </label>
                    ) : (
                        <div className="flex items-center justify-between p-3 bg-gray-700 border border-gray-600 rounded-md">
                            <p className="text-sm text-gray-300 truncate">{companyBible.name}</p>
                            {isProcessingPdf ? (
                                <div className="w-5 h-5 border-2 border-t-purple-400 border-gray-600 rounded-full animate-spin ml-2"></div>
                            ) : (
                                <button onClick={removeBible} className="ml-2 p-1 text-red-500 hover:text-red-400 rounded-full hover:bg-red-500/20"><TrashIcon className="w-5 h-5" /></button>
                            )}
                        </div>
                    )}
                     <input id="bible-upload" type="file" accept="application/pdf" onChange={handleBibleChange} className="hidden" disabled={!scriptsLoaded.pdfjs || isProcessingPdf}/>
                </div>
            </div>

            <div>
                 {mode === 'video' ? (
                     <div className="space-y-6">
                        <h2 className="text-lg font-semibold text-gray-300 -mb-2">4. Customize Your Video Ad Style</h2>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm text-gray-400 mb-1 block">Historical Era / Decade</label>
                                <select value={styleEra} onChange={e => setStyleEra(e.target.value)} className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors">
                                    {STYLE_ERAS.map(era => <option key={era} value={era}>{era}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-sm text-gray-400 mb-1 block">Target Audience</label>
                                <select value={styleAudience} onChange={e => setStyleAudience(e.target.value)} className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors">
                                    {STYLE_AUDIENCES.map(aud => <option key={aud} value={aud}>{aud}</option>)}
                                </select>
                            </div>
                        </div>
                        
                        <div>
                            <h3 className="text-md font-semibold text-gray-400 mb-2">Mood & Tone (Choose up to 3)</h3>
                            <div className="flex flex-wrap gap-2">
                                {STYLE_MOODS.map(mood => (
                                    <button key={mood} onClick={() => toggleMultiSelectItem(mood, styleMoods, setStyleMoods, 3)} className={`px-3 py-1 text-sm rounded-full border-2 transition-all duration-200 ${styleMoods.includes(mood) ? 'bg-pink-600 border-pink-400' : 'bg-gray-700/50 border-gray-600 hover:border-pink-500'}`}>
                                        {mood}
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        <div>
                            <h3 className="text-md font-semibold text-gray-400 mb-2">Visual Style & Techniques (Choose up to 3)</h3>
                            <div className="flex flex-wrap gap-2">
                                {STYLE_TECHNIQUES.map(tech => (
                                    <button key={tech} onClick={() => toggleMultiSelectItem(tech, styleTechniques, setStyleTechniques, 3)} className={`px-3 py-1 text-sm rounded-full border-2 transition-all duration-200 ${styleTechniques.includes(tech) ? 'bg-pink-600 border-pink-400' : 'bg-gray-700/50 border-gray-600 hover:border-pink-500'}`}>
                                        {tech}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-md font-semibold text-gray-400 mb-2">Color Palette (Choose one)</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {STYLE_PALETTES.map(palette => (
                                    <button key={palette} onClick={() => setStylePalette(palette)} className={`p-3 text-center rounded-lg border-2 transition-all duration-200 ${stylePalette === palette ? 'bg-pink-600 border-pink-400 shadow-lg' : 'bg-gray-700/50 border-gray-600 hover:border-pink-500'}`}>
                                        <span className="font-semibold text-sm">{palette}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-md font-semibold text-gray-400 mb-2">Aspect Ratio</h3>
                            <div className="grid grid-cols-3 gap-3">
                                {ASPECT_RATIOS.map(ratio => (
                                    <button key={ratio.id} onClick={() => setAspectRatio(ratio.id)} className={`p-3 text-center rounded-lg border-2 transition-all duration-200 flex flex-col items-center justify-center space-y-2 ${aspectRatio === ratio.id ? 'bg-pink-600 border-pink-400 shadow-lg' : 'bg-gray-700/50 border-gray-600 hover:border-pink-500'}`}>
                                        <div className="w-8 h-8 text-gray-300"><AspectRatioIcon ratio={ratio.id} /></div>
                                        <div>
                                            <span className="font-semibold text-sm block leading-tight">{ratio.name}</span>
                                            <span className="text-xs text-gray-300/70 block leading-tight">{ratio.id}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-md font-semibold text-gray-400 mb-2">Video Duration (Required)</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {VIDEO_DURATIONS.map(d => (
                                    <button key={d.id} onClick={() => setVideoDuration(d.id)} className={`p-3 text-center rounded-lg border-2 transition-all duration-200 ${videoDuration === d.id ? 'bg-pink-600 border-pink-400 shadow-lg' : 'bg-gray-700/50 border-gray-600 hover:border-pink-500'}`}>
                                        <span className="font-semibold text-sm">{d.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                    </div>
                 ) : (
                    <div className="space-y-6">
                        <h2 className="text-lg font-semibold text-gray-300 -mb-2">4. Customize Your Image Ad</h2>
                        {bibleGuidelines && (
                            <div className="p-4 bg-purple-900/30 rounded-lg border border-purple-700">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <InfoIcon className="w-6 h-6 text-purple-400 flex-shrink-0" />
                                        <h3 className="font-semibold text-purple-300">Brand Guidelines are Active</h3>
                                    </div>
                                    <button onClick={() => setShowBibleGuidelines(!showBibleGuidelines)} className="text-sm text-purple-300 hover:underline">
                                        {showBibleGuidelines ? 'Hide' : 'Show'}
                                    </button>
                                </div>
                                {showBibleGuidelines && (
                                    <pre className="mt-4 text-xs text-gray-400 whitespace-pre-wrap font-sans bg-gray-900 p-3 rounded-md max-h-40 overflow-y-auto">{bibleGuidelines}</pre>
                                )}
                            </div>
                        )}
                        <div className="space-y-3">
                            <Accordion title="Layout & Structure" defaultOpen={true}>
                                <h4 className="text-sm font-semibold text-gray-400">Layout</h4>
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                    {IMAGE_AD_LAYOUTS.map((layout) => (
                                    <button key={layout.id} onClick={() => handleImageStyleChange('layout', layout.id)} className={`p-2 text-center rounded-lg border-2 transition-all duration-200 aspect-square flex flex-col items-center justify-center ${imageAdStyle.layout === layout.id ? 'bg-blue-600 border-blue-400 shadow-lg' : 'bg-gray-700/50 border-gray-600 hover:border-blue-500'}`}>
                                        <div className="w-10 h-10 mb-1 text-gray-300"><LayoutIcon layout={layout.id} /></div>
                                        <span className="font-semibold text-xs leading-tight">{layout.name}</span>
                                    </button>
                                   ))}
                               </div>
                               <div className="border-t border-gray-700 my-4"></div>
                                <h4 className="text-sm font-semibold text-gray-400 mb-2">Padding</h4>
                                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                                    <div>
                                        <label className="text-sm text-gray-400 mb-1 block">Top: {imageAdStyle.padding.top}%</label>
                                        <input type="range" min="0" max="25" value={imageAdStyle.padding.top} onChange={e => handleImageStyleChange('padding', {...imageAdStyle.padding, top: parseInt(e.target.value, 10)})} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-400 mb-1 block">Bottom: {imageAdStyle.padding.bottom}%</label>
                                        <input type="range" min="0" max="25" value={imageAdStyle.padding.bottom} onChange={e => handleImageStyleChange('padding', {...imageAdStyle.padding, bottom: parseInt(e.target.value, 10)})} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-400 mb-1 block">Left: {imageAdStyle.padding.left}%</label>
                                        <input type="range" min="0" max="25" value={imageAdStyle.padding.left} onChange={e => handleImageStyleChange('padding', {...imageAdStyle.padding, left: parseInt(e.target.value, 10)})} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-400 mb-1 block">Right: {imageAdStyle.padding.right}%</label>
                                        <input type="range" min="0" max="25" value={imageAdStyle.padding.right} onChange={e => handleImageStyleChange('padding', {...imageAdStyle.padding, right: parseInt(e.target.value, 10)})} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                                    </div>
                                </div>

                               <div className="border-t border-gray-700 my-4"></div>
                               <h4 className="text-sm font-semibold text-gray-400 mb-2">Frame & Border</h4>
                               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div>
                                       <label className="text-sm text-gray-400 mb-1 block">Frame Effect</label>
                                       <select value={imageAdStyle.frameEffect} onChange={e => handleImageStyleChange('frameEffect', e.target.value)} className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">{FRAME_EFFECTS.map(effect => <option key={effect.id} value={effect.id}>{effect.name}</option>)}</select>
                                   </div>
                                   <div className="flex justify-between items-center">
                                       <label className="text-sm text-gray-400">Border Color</label>
                                       <input type="color" value={imageAdStyle.borderColor} onChange={e => handleImageStyleChange('borderColor', e.target.value)} className="w-16 h-8 bg-gray-700 border border-gray-600 rounded-md cursor-pointer" />
                                   </div>
                               </div>
                               <div className="mt-4">
                                  <label className="text-sm text-gray-400 mb-1 block">Border Width: {imageAdStyle.borderWidth}px</label>
                                  <input type="range" min="0" max="50" value={imageAdStyle.borderWidth} onChange={e => handleImageStyleChange('borderWidth', parseInt(e.target.value, 10))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                              </div>
                            </Accordion>
                            <Accordion title="Text & Typography">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm text-gray-400 mb-1 block">Font Family</label>
                                        <select value={imageAdStyle.fontFamily} onChange={e => handleImageStyleChange('fontFamily', e.target.value)} className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
                                          {FONT_FAMILIES.map(font => <option key={font} value={font} style={{fontFamily: font}}>{font.split(',')[0].replace(/"/g, '')}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-400 mb-1 block">Text Effect</label>
                                        <select value={imageAdStyle.textEffect} onChange={e => handleImageStyleChange('textEffect', e.target.value)} className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">{TEXT_EFFECTS.map(effect => <option key={effect.id} value={effect.id}>{effect.name}</option>)}</select>
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-400 mb-1 block">Font Weight</label>
                                        <select value={imageAdStyle.fontWeight} onChange={e => handleImageStyleChange('fontWeight', e.target.value)} className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
                                            <option value="normal">Normal</option>
                                            <option value="bold">Bold</option>
                                        </select>
                                    </div>
                                     <div>
                                        <label className="text-sm text-gray-400 mb-1 block">Text Transform</label>
                                        <select value={imageAdStyle.textTransform} onChange={e => handleImageStyleChange('textTransform', e.target.value)} className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">{TEXT_TRANSFORMS.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-400 mb-1 block">Letter Spacing: {imageAdStyle.letterSpacing}px</label>
                                    <input type="range" min="-5" max="20" value={imageAdStyle.letterSpacing} onChange={e => handleImageStyleChange('letterSpacing', parseInt(e.target.value, 10))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                                </div>
                                <div className="flex justify-between items-center">
                                    <label className="text-sm text-gray-400">Font Color</label>
                                    <input type="color" value={imageAdStyle.fontColor} onChange={e => handleImageStyleChange('fontColor', e.target.value)} className="w-16 h-8 bg-gray-700 border border-gray-600 rounded-md cursor-pointer" />
                                </div>
                            </Accordion>
                            <Accordion title="Colors & Image Filters">
                               <div>
                                   <label className="text-sm text-gray-400 mb-1 block">Image Filter</label>
                                   <select value={imageAdStyle.imageFilter} onChange={e => handleImageStyleChange('imageFilter', e.target.value)} className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">{IMAGE_FILTERS.map(filter => <option key={filter.id} value={filter.id}>{filter.name}</option>)}</select>
                               </div>
                               {imageAdStyle.imageFilter === 'duotone' && (
                                   <div className="p-3 bg-gray-700/50 rounded-md grid grid-cols-2 gap-3">
                                       <div className="flex justify-between items-center">
                                            <label className="text-xs text-gray-400">Shadow</label>
                                            <input type="color" value={imageAdStyle.duotoneColor1} onChange={e => handleImageStyleChange('duotoneColor1', e.target.value)} className="w-12 h-8 bg-gray-700 border border-gray-600 rounded-md cursor-pointer" />
                                       </div>
                                       <div className="flex justify-between items-center">
                                            <label className="text-xs text-gray-400">Highlight</label>
                                            <input type="color" value={imageAdStyle.duotoneColor2} onChange={e => handleImageStyleChange('duotoneColor2', e.target.value)} className="w-12 h-8 bg-gray-700 border border-gray-600 rounded-md cursor-pointer" />
                                       </div>
                                   </div>
                               )}
                               <div>
                                    <label className="text-sm text-gray-400 mb-1 block">Brightness: {imageAdStyle.brightness}%</label>
                                    <input type="range" min="0" max="200" value={imageAdStyle.brightness} onChange={e => handleImageStyleChange('brightness', parseInt(e.target.value, 10))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                               </div>
                               <div>
                                    <label className="text-sm text-gray-400 mb-1 block">Contrast: {imageAdStyle.contrast}%</label>
                                    <input type="range" min="0" max="200" value={imageAdStyle.contrast} onChange={e => handleImageStyleChange('contrast', parseInt(e.target.value, 10))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                               </div>
                               <div>
                                    <label className="text-sm text-gray-400 mb-1 block">Saturation: {imageAdStyle.saturate}%</label>
                                    <input type="range" min="0" max="200" value={imageAdStyle.saturate} onChange={e => handleImageStyleChange('saturate', parseInt(e.target.value, 10))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                               </div>
                               <div className="border-t border-gray-700 my-2"></div>
                               <div className="flex items-center gap-3">
                                   <input type="checkbox" id="useGradient" checked={imageAdStyle.useGradient} onChange={e => handleImageStyleChange('useGradient', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                   <label htmlFor="useGradient" className="text-sm text-gray-300">Use Gradient Background</label>
                               </div>
                               {imageAdStyle.useGradient ? (
                                   <div className="p-3 bg-gray-700/50 rounded-md grid grid-cols-2 gap-3">
                                       <div className="flex justify-between items-center">
                                            <label className="text-xs text-gray-400">Start</label>
                                            <input type="color" value={imageAdStyle.backgroundGradientStart} onChange={e => handleImageStyleChange('backgroundGradientStart', e.target.value)} className="w-12 h-8 bg-gray-700 border border-gray-600 rounded-md cursor-pointer" />
                                       </div>
                                       <div className="flex justify-between items-center">
                                            <label className="text-xs text-gray-400">End</label>
                                            <input type="color" value={imageAdStyle.backgroundGradientEnd} onChange={e => handleImageStyleChange('backgroundGradientEnd', e.target.value)} className="w-12 h-8 bg-gray-700 border border-gray-600 rounded-md cursor-pointer" />
                                       </div>
                                   </div>
                               ) : (
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm text-gray-400">Background Color</label>
                                        <input type="color" value={imageAdStyle.backgroundColor} onChange={e => handleImageStyleChange('backgroundColor', e.target.value)} className="w-16 h-8 bg-gray-700 border border-gray-600 rounded-md cursor-pointer" />
                                    </div>
                               )}
                                <div>
                                    <label className="text-sm text-gray-400 mb-1 block">Background Opacity: {Math.round(imageAdStyle.backgroundOpacity * 100)}%</label>
                                    <input type="range" min="0" max="1" step="0.01" value={imageAdStyle.backgroundOpacity} onChange={e => handleImageStyleChange('backgroundOpacity', parseFloat(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                                </div>
                            </Accordion>
                        </div>
                    </div>
                )}
            </div>
            
            <div className="text-center pt-4">
              <button onClick={mode === 'video' ? handleGenerateVideoClick : handleGenerateImageClick} disabled={isGenerateDisabled} className={`px-12 py-4 text-white font-bold text-lg rounded-full shadow-lg transform transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-none ${mode === 'video' ? 'bg-gradient-to-r from-purple-600 to-pink-600' : 'bg-gradient-to-r from-cyan-600 to-blue-600'}`}>
                  <span className="flex items-center justify-center"><SparklesIcon className="w-6 h-6 mr-2" />{mode === 'video' ? 'Generate Video Ad' : 'Generate Image Ad'}</span>
              </button>
               {isGenerateDisabled && uploadedImages.length > 0 && companyName.trim().length > 0 && <p className="text-xs text-gray-500 mt-2">Please complete all required steps and style options to continue.</p>}
            </div>
        </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans p-4 sm:p-8">
      <div className="container mx-auto max-w-3xl">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-transparent bg-clip-text">AI Ad Generator</h1>
          <p className="mt-4 text-lg text-gray-400">Turn your images into stunning, branded ads in seconds.</p>
        </header>
        <div className="mb-8 flex justify-center p-1 bg-gray-700/50 rounded-full w-full max-w-sm mx-auto">
          <button onClick={() => setMode('video')} className={`w-1/2 py-2 px-4 rounded-full text-sm font-semibold transition-colors duration-300 ${mode === 'video' ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-gray-600/50'}`}>AI Video Ad</button>
          <button onClick={() => setMode('image')} className={`w-1/2 py-2 px-4 rounded-full text-sm font-semibold transition-colors duration-300 ${mode === 'image' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-600/50'}`}>Static Image Ad</button>
        </div>
        <main className="bg-gray-800/50 p-6 sm:p-10 rounded-2xl shadow-2xl shadow-purple-900/20 border border-gray-700">
          {renderContent()}
        </main>
        <footer className="text-center mt-12 text-gray-600 text-sm">
            <p>Powered by Gemini. Built with React & Tailwind CSS.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
