import type { ApiResponse } from "@/services/types";
import slideshowApi from "./client";
import type { SlideshowBootData } from "../types";

export async function getSlideshowBoot(code: string): Promise<SlideshowBootData> {
    const { data } = await slideshowApi.get<ApiResponse<SlideshowBootData>>(`/v1/slideshow/${code}/boot`);
    return data.data;
}

export default getSlideshowBoot;
