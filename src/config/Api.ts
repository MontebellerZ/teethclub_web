import axios from "axios";
import Env from "../utils/env";

const removeBgApi = axios.create({
  baseURL: Env.REMOVEBG_API_URL,
  headers: { "X-Api-Key": Env.REMOVEBG_API_KEY },
});

class Api {
  static async removeBackground(
    imageB64: string,
    size: "preview" | "auto" | "full" | "50MP" = "preview"
  ): Promise<string> {
    const formData = new FormData();
    formData.append("image_file_b64", imageB64);
    formData.append("size", size);

    const res = await removeBgApi.post("/", formData, { responseType: "blob" });

    const imageUrl = URL.createObjectURL(res.data);

    return imageUrl;
  }
}

export default Api;
