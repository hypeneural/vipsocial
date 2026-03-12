import { beforeEach, describe, expect, it, vi } from "vitest";

const { getMock } = vi.hoisted(() => ({
    getMock: vi.fn(),
}));

vi.mock("@/services/api", () => ({
    default: {
        get: getMock,
    },
}));

import newsRadarWhatsAppService, {
    normalizeBooleanQueryParam,
    normalizeGroupsQueryParams,
    normalizeTimelineQueryParams,
} from "@/features/news-radar-whatsapp/api/newsRadarWhatsApp.service";

describe("newsRadarWhatsAppService query param normalization", () => {
    beforeEach(() => {
        getMock.mockReset();
        getMock.mockResolvedValue({
            data: {
                success: true,
                data: [],
                message: "",
            },
        });
    });

    it("normalizes boolean query params to 1 or undefined", () => {
        expect(normalizeBooleanQueryParam(true)).toBe("1");
        expect(normalizeBooleanQueryParam(false)).toBeUndefined();
        expect(normalizeBooleanQueryParam(undefined)).toBeUndefined();
    });

    it("normalizes group list params", () => {
        expect(normalizeGroupsQueryParams({ include_inactive: true })).toEqual({
            include_inactive: "1",
        });

        expect(normalizeGroupsQueryParams({ include_inactive: false })).toEqual({
            include_inactive: undefined,
        });
    });

    it("normalizes timeline params", () => {
        expect(
            normalizeTimelineQueryParams({
                include_ignored: true,
                per_page: 30,
                search: "teste",
            }),
        ).toEqual({
            include_ignored: "1",
            per_page: 30,
            search: "teste",
        });

        expect(
            normalizeTimelineQueryParams({
                include_ignored: false,
                per_page: 30,
            }),
        ).toEqual({
            include_ignored: undefined,
            per_page: 30,
        });
    });

    it("omits false include_ignored when requesting the timeline", async () => {
        await newsRadarWhatsAppService.getGroupTimeline("group-1", {
            include_ignored: false,
            per_page: 30,
        });

        expect(getMock).toHaveBeenCalledWith(
            "/news-radar/whatsapp/groups/group-1/timeline",
            {
                params: {
                    include_ignored: undefined,
                    per_page: 30,
                },
            },
        );
    });
});
