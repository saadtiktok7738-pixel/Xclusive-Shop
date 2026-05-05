import React, { useEffect, useState } from "react";
import { db } from "../../lib/firebase.js";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { compressImage } from "../../lib/imageUtils.js";
import { Trash2, UploadCloud, Smartphone, Monitor } from "lucide-react";
import { toast } from "sonner";

const MAX_BANNERS = 5;

const DEFAULT_BANNER_SIZE = "1920 × 640 px (desktop / wide screens)";
const MOBILE_BANNER_SIZE = "800 × 800 px (phones / small screens)";

export default function Banners() {
  const [banners, setBanners] = useState([]);
  const [uploadingDefault, setUploadingDefault] = useState(false);
  const [uploadingMobile, setUploadingMobile] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, "banners"), orderBy("order", "asc")),
      (snap) => {
        setBanners(
          snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          }))
        );
      }
    );
    return () => unsub();
  }, []);

  const onUploadDefault = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (banners.length >= MAX_BANNERS) {
      toast.error(`Limit reached: max ${MAX_BANNERS} banners.`);
      return;
    }

    setUploadingDefault(true);

    try {
      const dataUrl = await compressImage(file, 1920, 0.85);

      await addDoc(collection(db, "banners"), {
        image: dataUrl,
        imageMobile: null,
        order: banners.length,
        createdAt: new Date().toISOString(),
      });
      toast.success("Banner added — you can now attach a mobile image below.");
    } catch (err) {
      console.error(err);
      toast.error("Upload failed: " + (err?.message ?? "unknown"));
    } finally {
      setUploadingDefault(false);
    }
  };

  const onUploadMobile = async (bannerId, e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploadingMobile(bannerId);

    try {
      const dataUrl = await compressImage(file, 1000, 0.85);

      await updateDoc(doc(db, "banners", bannerId), {
        imageMobile: dataUrl,
      });

      toast.success("Mobile banner updated");
    } catch (err) {
      console.error(err);
      toast.error("Mobile upload failed: " + (err?.message ?? "unknown"));
    } finally {
      setUploadingMobile(null);
    }
  };

  const removeMobile = async (bannerId) => {
    try {
      await updateDoc(doc(db, "banners", bannerId), {
        imageMobile: null,
      });
      toast.success("Mobile banner removed");
    } catch {
      toast.error("Failed to remove mobile banner");
    }
  };

  const doRemove = async (id) => {
    try {
      await deleteDoc(doc(db, "banners", id));
      toast.success("Banner removed");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const remove = (id) => {
    toast("Delete this banner?", {
      action: {
        label: "Delete",
        onClick: () => void doRemove(id),
      },
      cancel: {
        label: "Cancel",
        onClick: () => {},
      },
      duration: 6000,
    });
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Banners</h1>
        <p className="text-sm text-neutral-500">
          {banners.length} / {MAX_BANNERS} banners. Each banner can have a
          default (desktop) and an optional mobile image.
        </p>
      </div>

      {/* Add banner */}
      <div className="border border-neutral-200 bg-white p-4 md:p-6">
        <h2 className="text-sm font-semibold">Add a banner</h2>

        <div className="mt-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-neutral-700">
            <Monitor className="h-3.5 w-3.5" />
            Default banner (desktop)
            <span className="ml-1 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px]">
              Recommended: {DEFAULT_BANNER_SIZE}
            </span>
          </div>

          <label
            className={`flex cursor-pointer items-center justify-center gap-2 border-2 border-dashed border-neutral-300 px-4 py-8 text-sm font-medium ${
              uploadingDefault || banners.length >= MAX_BANNERS
                ? "pointer-events-none opacity-60"
                : "hover:bg-[#a8e063]/5"
            }`}
          >
            <UploadCloud className="h-5 w-5" />
            {uploadingDefault
              ? "Uploading..."
              : banners.length >= MAX_BANNERS
              ? `Maximum ${MAX_BANNERS} reached`
              : "Click to choose image"}

            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onUploadDefault}
              disabled={uploadingDefault || banners.length >= MAX_BANNERS}
            />
          </label>
        </div>
      </div>

      {/* List */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {banners.map((b) => (
          <div key={b.id} className="border bg-white">
            <img
              src={b.image}
              alt={b.title || "banner"}
              className="h-44 w-full object-cover"
            />

            <div className="p-3 space-y-3">
              <div className="flex justify-between">
                <div>
                  <p className="font-semibold text-sm">
                    {b.title || "Untitled"}
                  </p>
                  {b.subtitle && (
                    <p className="text-xs text-neutral-500">{b.subtitle}</p>
                  )}
                </div>

                <button
                  onClick={() => remove(b.id)}
                  className="text-red-600 p-2 border"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Mobile */}
              <div className="border-t pt-3">
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <Smartphone className="h-3.5 w-3.5" />
                  Mobile banner
                </div>

                {b.imageMobile ? (
                  <div className="mt-2 space-y-2">
                    <img
                      src={b.imageMobile}
                      className="h-28 w-28 object-cover border"
                      alt="mobile"
                    />

                    <div className="flex gap-2">
                      <label className="border px-3 py-1 text-xs cursor-pointer">
                        Replace
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => onUploadMobile(b.id, e)}
                        />
                      </label>

                      <button
                        onClick={() => removeMobile(b.id)}
                        className="border px-3 py-1 text-xs text-red-600"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="border-dashed border p-3 flex items-center justify-center gap-2 cursor-pointer text-xs">
                    <UploadCloud className="h-4 w-4" />
                    Upload mobile image
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => onUploadMobile(b.id, e)}
                    />
                  </label>
                )}
              </div>
            </div>
          </div>
        ))}

        {banners.length === 0 && (
          <div className="col-span-full text-center border p-10 text-sm text-gray-500">
            No banners yet
          </div>
        )}
      </div>
    </div>
  );
}