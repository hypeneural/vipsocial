import { useParams } from "react-router-dom";
import SlideshowRoot from "@/features/vip-gallery/slideshow/components/SlideshowRoot";

const SlideshowPage = () => {
    const { code } = useParams<{ code: string }>();

    if (!code) {
        return null;
    }

    return <SlideshowRoot code={code} />;
};

export default SlideshowPage;
