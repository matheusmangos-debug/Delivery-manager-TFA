
import { GoogleGenAI, Type } from "@google/genai";

export class GeminiService {
  /* Use process.env.API_KEY diretamente conforme as diretrizes */
  private static getAI() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  /* Gera imagens de marketing usando gemini-3-pro-image-preview */
  static async generateMarketingImage(prompt: string, size: "1K" | "2K" | "4K" = "1K") {
    const ai = this.getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [{ text: `Fotografia profissional de alta qualidade para serviço logístico: ${prompt}` }]
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
          imageSize: size
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  }

  /* Edita imagens usando gemini-2.5-flash-image */
  static async editImage(imageBase64: string, instruction: string) {
    const ai = this.getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: imageBase64.split(',')[1],
              mimeType: 'image/png'
            }
          },
          { text: instruction }
        ]
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  }

  /* Chat assistente profissional usando gemini-3-pro-preview */
  static async chatWithAssistant(message: string, history: any[] = []) {
    const ai = this.getAI();
    const chat = ai.chats.create({
      model: 'gemini-3-pro-preview',
      config: {
        systemInstruction: "Você é o assistente virtual da SwiftLog Pro. Ajude com dúvidas sobre entregas, devoluções e relatórios.",
      }
    });

    const response = await chat.sendMessage({ message });
    return response.text;
  }

  /* Extração inteligente de arquivos (Imagens/PDFs) */
  static async parseCustomerFile(base64Data: string, mimeType: string) {
    const ai = this.getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType
            }
          },
          { text: "Extraia os dados de clientes, entregas e QUANTIDADE DE CAIXAS (Volumes) deste documento." }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: this.deliverySchema
      }
    });

    try {
      const text = response.text || "[]";
      return JSON.parse(text);
    } catch (e) {
      console.error("Erro ao parsear JSON da IA", e);
      return [];
    }
  }

  /* Extração inteligente de texto copiado de PLANILHAS */
  static async parseSpreadsheetText(rawText: string) {
    const ai = this.getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analise o seguinte texto copiado de uma planilha de logística e extraia as colunas para um formato JSON estruturado. Identifique: Matrícula do cliente, Nome, Endereço, Código de Rastreio/Transporte, Nome do Motorista e Quantidade de Caixas (Volumes). Texto: \n\n${rawText}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: this.deliverySchema
      }
    });

    try {
      const text = response.text || "[]";
      return JSON.parse(text);
    } catch (e) {
      console.error("Erro ao parsear texto da planilha", e);
      return [];
    }
  }

  private static deliverySchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING },
        customerId: { type: Type.STRING, description: "Matrícula do cliente" },
        customerName: { type: Type.STRING },
        address: { type: Type.STRING },
        status: { type: Type.STRING },
        date: { type: Type.STRING },
        trackingCode: { type: Type.STRING },
        driverName: { type: Type.STRING },
        branch: { type: Type.STRING },
        boxQuantity: { type: Type.INTEGER, description: "Quantidade total de caixas/volumes" },
        items: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      },
      required: ["customerId", "customerName", "address", "trackingCode"]
    }
  };
}
