// src/components/product/ProductDetail.js
"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import CountryFlag from "@/components/ui/CountryFlag";
import ProductTabs from "./ProductTabs";
import ImageGallery from "./ImageGallery";
import ShareModal from "@/components/ui/ShareModal";
import LoginModal from "@/components/ui/LoginModal";
import ConnectModal from "@/components/ui/ConnectModal";

export default function ProductDetail({ product, supplier }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isSaved, setIsSaved] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const formRef = useRef(null);
  const [requestForm, setRequestForm] = useState({
    name: "",
    lastName: "",
    email: "",
    phone: "",
    quantity: "",
    requestedPrice: "",
    description: "",
  });
  const [sending, setSending] = useState(false);
  // ====== Check saved status from database ======
  useEffect(() => {
    const checkSavedStatus = async () => {
      if (!session?.user || !product?.id) return;

      try {
        const res = await fetch(
          `/api/user/saved-products?productId=${product.id}`,
        );
        if (res.ok) {
          const data = await res.json();
          setIsSaved(data.isSaved || false);
        }
      } catch (error) {
        console.error("Error checking saved status:", error);
      }
    };

    checkSavedStatus();
  }, [product?.id, session]);
  // ====== ارسال درخواست ======
  const handleSendRequest = async (e) => {
    e.preventDefault();

    if (!session) {
      setIsLoginModalOpen(true);
      return;
    }

    setSending(true);
    try {
      const formData = new FormData(e.target);

      // ✅ supplierId: از product.userId استفاده کن
      const supplierId = product.userId;

      // اگر supplierId وجود نداشت، خطا بده
      if (!supplierId) {
        toast.error("Supplier information is missing. Please try again.");
        setSending(false);
        return;
      }

      const data = {
        productId: product.id,
        supplierId: supplierId,
        message:
          formData.get("description") || "I'm interested in this product.",
        quantity: formData.get("quantity")
          ? parseInt(formData.get("quantity"))
          : null,
        requestedPrice: formData.get("requestedPrice")
          ? parseFloat(formData.get("requestedPrice"))
          : null,
      };

      const res = await fetch("/api/product-inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const response = await res.json();
      if (!res.ok)
        throw new Error(response.message || "Failed to send request");

      toast.success("Request sent successfully!");
      e.target.reset(); // Reset form
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSending(false);
    }
  };
  // ====== بعد از لاگین موفق، دوباره فرم را ارسال کن ======
  const handleLoginSuccess = () => {
    // پس از لاگین، دوباره فرم را ارسال می‌کنیم
    if (formRef.current) {
      const event = new Event("submit", { cancelable: true, bubbles: true });
      formRef.current.dispatchEvent(event);
    }
  }; // ====== تغییرات فرم ======
  const handleRequestChange = (e) => {
    const { name, value } = e.target;
    setRequestForm((prev) => ({ ...prev, [name]: value }));
  };
  // ====== Toggle save/unsave ======
  const toggleSave = async () => {
    if (!session) {
      toast.warning("Please sign in to save products");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/user/saved-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to update saved products");
      }

      setIsSaved(data.isSaved);
      toast.success(data.message);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  // ====== Default data ======
  const defaultProduct = {
    id: "default-id",
    name: "Premium Wildflower Honey",
    category: "Honey & Sweeteners",
    createdAt: "3 days ago",
    honeyType: "Wildflower Honey",
    moq: "2 units",
    countryOfOrigin: "New Zealand",
    countryCode: "nz",
    price: 120,
    currency: "USD",
    annualSupply: "1000 tons",
    shippingCountries: ["United States", "Canada", "United Kingdom"],
    features: ["Raw", "Organic", "Unfiltered"],
    shortDesc:
      "This pure wildflower honey is sourced from local beehives in the heart of New Zealand. It has a delicate floral aroma and a slightly sweet, nutty flavor.",
    fullDesc:
      "This pure wildflower honey is sourced from local beehives in the heart of New Zealand. It has a delicate floral aroma and a slightly sweet, nutty flavor. Perfect for drizzling on toast, adding to tea, or using in baking.",
    images: [
      "https://placehold.co/360x360",
      "https://placehold.co/64x64",
      "https://placehold.co/64x64",
      "https://placehold.co/64x64",
      "https://placehold.co/64x64",
      "https://placehold.co/64x64",
      "https://placehold.co/64x64",
    ],
  };

  const defaultSupplier = {
    name: "Kedora Trading",
    website: "KedoraTrading.com",
    foundingYear: 2000,
    country: "India",
    countryCode: "in",
    logo: "https://placehold.co/55x50",
    coverImage: "https://placehold.co/303x80",
  };

  const data = product || defaultProduct;
  const supplierData = supplier || defaultSupplier;
  const productImages = data.images || [];

  return (
    <>
      <div className="product-detail-container">
        {/* ====== Breadcrumb ====== */}
        <nav className="product-breadcrumb" aria-label="Breadcrumb">
          <ol className="breadcrumb-list">
            <li className="breadcrumb-item">
              <Link href="/">Home</Link>
            </li>
            <li className="breadcrumb-item">
              <Link href="/products">Products</Link>
            </li>
            <li className="breadcrumb-item">
              <Link
                href={`/products?category=${encodeURIComponent(data.category || "all")}`}
              >
                {data.category || "All"}
              </Link>
            </li>
            <li className="breadcrumb-item active" aria-current="page">
              {data.name}
            </li>
          </ol>
        </nav>

        {/* ====== Main row ====== */}
        <div className="product-detail-row">
          {/* Gallery */}
          <ImageGallery images={productImages} productName={data.name} />

          {/* Product Info */}
          <div className="product-info-wrapper">
            <div className="product-info-header">
              <h1 className="product-title">{data.name}</h1>
              <div className="product-meta">
                <span className="product-date">{data.createdAt}</span>
                <span className="product-divider"></span>
                <button className="product-share-btn" onClick={handleShare}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M12 5.33333L14 7.33333L12 9.33333"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M14 7.33333H8"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M10.6667 2H2.66667C2.29848 2 2 2.29848 2 2.66667V12C2 12.3682 2.29848 12.6667 2.66667 12.6667H10.6667C11.0349 12.6667 11.3333 12.3682 11.3333 12V9.33333"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Share
                </button>
                <span className="product-divider"></span>
                <button
                  className={`product-save-btn ${isSaved ? "saved" : ""}`}
                  onClick={toggleSave}
                  disabled={loading}
                  title={isSaved ? "Remove from saved" : "Save product"}
                >
                  <i
                    className={`fas ${isSaved ? "fa-bookmark" : "fa-bookmark"}`}
                  ></i>
                  {loading ? "..." : isSaved ? " Saved" : " Save"}
                </button>
              </div>
            </div>

            {/* Specs */}
            <div className="product-specs-grid">
              <div className="product-specs-column">
                <div className="product-spec-item">
                  <span className="spec-label">Price</span>
                  <span className="spec-value">
                    {data.price}{" "}
                    <span className="spec-currency">{data.currency}</span>
                  </span>
                </div>
                <div className="product-spec-item">
                  <span className="spec-label">Minimum Order Quantity</span>
                  <span className="spec-value">{data.moq || "—"}</span>
                </div>
                <div className="product-spec-item">
                  <span className="spec-label">Lead Time (days)</span>
                  <span className="spec-value">{data.leadTime || "—"}</span>
                </div>
                <div className="product-spec-item">
                  <span className="spec-label">Unit</span>
                  <span className="spec-value">{data.unit || "—"}</span>
                </div>
              </div>
              <div className="product-specs-column">
                <div className="product-spec-item">
                  <span className="spec-label">Country of Origin</span>
                  <div className="spec-value-with-flag">
                    <CountryFlag
                      countryCode={data.countryCode || data.countryOfOrigin}
                      size="20px"
                    />
                    <span>{data.country || data.countryOfOrigin || "—"}</span>
                  </div>
                </div>
                <div className="product-spec-item">
                  <span className="spec-label">Shipping Terms</span>
                  <span className="spec-value">
                    {data.shippingTerms || "—"}
                  </span>
                </div>
                <div className="product-spec-item">
                  <span className="spec-label">Packaging</span>
                  <span className="spec-value">{data.packaging || "—"}</span>
                </div>
                <div className="product-spec-item">
                  <span className="spec-label">Certifications</span>
                  <span className="spec-value">
                    {data.certifications || "—"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Supplier Card */}
          <div className="supplier-card">
            <img
              src={supplierData.coverImage}
              alt="Cover"
              className="supplier-cover"
            />
            <div className="supplier-logo-wrapper">
              <img src={supplierData.logo} alt={supplierData.name} />
            </div>
            <div className="supplier-info">
              <div className="supplier-info-inner">
                <div>
                  <h3 className="supplier-name">{supplierData.name}</h3>
                  <p className="supplier-website">{supplierData.website}</p>
                </div>
                <div className="supplier-divider"></div>
              </div>
              <div className="supplier-details-grid">
                <div className="supplier-detail-item">
                  <span className="detail-label">Founding</span>
                  <span className="detail-value">
                    {supplierData.foundingYear}
                  </span>
                </div>
                <div className="supplier-detail-item">
                  <span className="detail-label">Country</span>
                  <div className="detail-value-with-flag">
                    <CountryFlag
                      countryCode={
                        supplierData.countryCode || supplierData.country
                      }
                      size="20px"
                    />
                    <span>{supplierData.country}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="supplier-actions">
              <Link
                href={`/profile/${supplierData.id}`}
                className="company-info-link"
              >
                Company information
              </Link>
              <button
                className="connect-btn"
                onClick={() => setIsConnectModalOpen(true)}
              >
                Connect with Us
              </button>
            </div>{" "}
          </div>
        </div>

        {/* ====== Short Description ====== */}
        <div className="product-description-short">
          <h3>About This Product</h3>
          <div className="product-description-short-content">
            <p>{data.shortDesc || "No short description available."}</p>
            {data.fullDesc && data.fullDesc.length > 0 && (
              <a
                href="#product-description"
                className="show-full-description-link"
                onClick={(e) => {
                  e.preventDefault();
                  const element = document.getElementById(
                    "product-description",
                  );
                  if (element) {
                    element.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  }
                }}
              >
                <span>Show Full Description</span>
                <i className="fas fa-chevron-down"></i>
              </a>
            )}
          </div>
        </div>

        {/* ====== Tabs + Request Form ====== */}
        <div className="product-detail-bottom">
          <ProductTabs product={data} />
          <div className="request-form-card">
            <h3>Send Request</h3>
            <form
              ref={formRef}
              className="request-form"
              onSubmit={handleSendRequest}
            >
              <div className="form-row">
                <div className="form-group">
                  <label>
                    Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Your name"
                    defaultValue={session?.user?.name?.split(" ")[0] || ""}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>
                    Last Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Your last name"
                    defaultValue={
                      session?.user?.name?.split(" ").slice(1).join(" ") || ""
                    }
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>
                    Email <span className="text-danger">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    placeholder="your@email.com"
                    defaultValue={session?.user?.email || ""}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="+1 234 567 890"
                    defaultValue={session?.user?.phone || ""}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Order Quantity</label>
                  <input type="number" name="quantity" placeholder="Quantity" />
                </div>
                <div className="form-group">
                  <label>Requested Price</label>
                  <input type="text" name="requestedPrice" placeholder="USD" />
                </div>
              </div>
              <div className="form-group full-width">
                <label>Description</label>
                <textarea
                  rows="3"
                  name="description"
                  placeholder="Your message..."
                />
              </div>
              <button type="submit" className="submit-btn" disabled={sending}>
                {sending ? "Sending..." : "Send Request"}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ====== Share Modal ====== */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        product={data}
      />

      {/* ====== مودال لاگین ====== */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        redirectUrl={pathname}
      />
      <ConnectModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        supplierId={supplierData.id}
        supplierName={supplierData.name}
        productId={product?.id}
      />
      {/* ====== Styles ====== */}
      <style jsx>{`
        .product-detail-container {
          width: 100%;
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 20px;
        }

        /* ====== Breadcrumb ====== */
        .product-breadcrumb {
          padding: 16px 0 20px;
        }

        .breadcrumb-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0;
          list-style: none;
          padding: 0;
          margin: 0;
          font-size: 13px;
          color: var(--gray);
        }

        .breadcrumb-item {
          display: inline-flex;
          align-items: center;
        }

        /* ✅ فقط آیتم‌هایی که آخرین نیستند، اسلش می‌گیرند */
        .breadcrumb-item:not(:last-child)::after {
          content: "/";
          margin: 0 8px;
          color: var(--gray-light);
        }

        /* حذف اسلش از آخرین آیتم (اضافی) */
        .breadcrumb-item:last-child::after {
          display: none;
        }

        /* حذف هرگونه ::before از قبل */
        .breadcrumb-item::before {
          display: none !important;
        }

        /* لینک‌ها */
        .breadcrumb-item a {
          color: var(--primary);
          text-decoration: none;
          transition: var(--transition);
        }

        .breadcrumb-item a:hover {
          color: var(--primary-dark);
          text-decoration: underline;
        }

        .breadcrumb-item.active {
          color: var(--gray-dark);
          font-weight: 500;
        }

        /* Main row */
        .product-detail-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 30px;
          flex-wrap: wrap;
        }

        .product-info-wrapper {
          flex: 1;
          min-width: 280px;
        }

        .product-info-header {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-bottom: 22px;
        }

        .product-title {
          font-size: 24px;
          font-weight: 600;
          color: #052311;
          font-family: "Poppins", sans-serif;
          line-height: 43.2px;
          margin: 0;
        }

        .product-meta {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .product-date {
          color: rgba(5, 35, 17, 0.6);
          font-size: 14px;
          font-weight: 400;
          font-family: "Poppins", sans-serif;
        }

        .product-divider {
          width: 1px;
          height: 18px;
          background: rgba(0, 0, 0, 0.2);
        }

        .product-share-btn,
        .product-save-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: none;
          border: none;
          color: rgba(5, 35, 17, 0.6);
          font-size: 13px;
          cursor: pointer;
          font-family: "Poppins", sans-serif;
          padding: 4px 8px;
          border-radius: 8px;
          transition: all 0.3s ease;
        }

        .product-share-btn:hover {
          color: #ea6a18;
          background: rgba(234, 106, 24, 0.05);
        }

        .product-save-btn {
          color: rgba(5, 35, 17, 0.6);
        }

        .product-save-btn:hover {
          color: #ea6a18;
          background: rgba(234, 106, 24, 0.05);
        }

        .product-save-btn.saved {
          color: #ea6a18;
          background: rgba(234, 106, 24, 0.08);
        }

        .product-save-btn.saved:hover {
          color: #c73e1d;
          background: rgba(234, 106, 24, 0.15);
        }

        .product-save-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Specs */
        .product-specs-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 23px 30px;
          align-items: start;
          width: 100%;
        }

        .product-specs-column {
          display: flex;
          flex-direction: column;
          gap: 23px;
        }

        .product-spec-item {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 5px;
          position: relative;
          padding-left: 14px;
        }

        .product-spec-item::before {
          content: "";
          position: absolute;
          left: 0;
          top: 2px;
          width: 3px;
          height: 18px;
          background: #5dc888;
          border-radius: 2px;
        }

        .spec-label {
          color: rgba(5, 35, 17, 0.6);
          font-size: 14px;
          font-weight: 400;
          font-family: "Poppins", sans-serif;
          line-height: 21px;
        }

        .spec-value {
          font-size: 16px;
          font-weight: 600;
          color: #052311;
          font-family: "Poppins", sans-serif;
          line-height: 24px;
        }

        .spec-currency {
          font-weight: 400;
          font-size: 14px;
          color: rgba(5, 35, 17, 0.6);
        }

        .spec-value-with-flag {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        /* Supplier Card */
        .supplier-card {
          width: 290px;
          flex-shrink: 0;
          background: white;
          border-radius: 20px;
          box-shadow: 0px 7px 25px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          position: relative;
          padding-bottom: 16px;
        }

        .supplier-cover {
          width: 100%;
          height: 80px;
          object-fit: cover;
          box-shadow: 0px 4px 6.8px rgba(0, 0, 0, 0.15);
        }

        .supplier-logo-wrapper {
          width: 65px;
          height: 65px;
          border-radius: 74px;
          background: #080f3b;
          box-shadow: 0px 7.667px 18.145px rgba(0, 0, 0, 0.15);
          border: 1.28px solid rgba(255, 255, 255, 0.3);
          overflow: hidden;
          margin: -32px auto 0;
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .supplier-logo-wrapper img {
          width: 55px;
          height: 50px;
          object-fit: contain;
        }

        .supplier-info {
          padding: 8px 20px 0;
        }

        .supplier-info-inner {
          padding-left: 0;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 8px;
        }

        .supplier-name {
          font-size: 16px;
          font-weight: 600;
          color: #052311;
          font-family: "Poppins", sans-serif;
          line-height: 24px;
          margin: 0;
        }

        .supplier-website {
          font-size: 14px;
          color: rgba(5, 35, 17, 0.6);
          font-family: "Poppins", sans-serif;
          line-height: 21px;
          margin: 0;
        }

        .supplier-divider {
          width: 171.45px;
          height: 1px;
          background: #f7c3a3;
          margin: 4px 0 0 0;
        }

        .supplier-details-grid {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          padding: 8px 0;
        }

        .supplier-detail-item {
          display: flex;
          flex-direction: column;
          gap: 5px;
          padding: 8px 0;
        }

        .detail-label {
          font-size: 14px;
          color: rgba(5, 35, 17, 0.6);
          font-weight: 400;
          font-family: "Poppins", sans-serif;
        }

        .detail-value {
          font-size: 16px;
          font-weight: 600;
          color: #000;
          font-family: "Poppins", sans-serif;
        }

        .detail-value-with-flag {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .detail-value-with-flag span {
          font-size: 16px;
          font-weight: 600;
          color: #052311;
        }

        .supplier-actions {
          padding: 0 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          margin-top: 4px;
        }

        .company-info-link {
          color: rgba(22, 144, 212, 0.8);
          font-size: 14px;
          font-weight: 400;
          font-family: "Poppins", sans-serif;
          cursor: pointer;
        }

        .company-info-link:hover {
          color: #168fd4;
        }

        .connect-btn {
          width: 100%;
          padding: 8px 20px;
          background: transparent;
          border: 1px solid #5dc888;
          border-radius: 10px;
          color: #117c3c;
          font-size: 14px;
          font-weight: 400;
          font-family: "Poppins", sans-serif;
          cursor: pointer;
        }

        .connect-btn:hover {
          background: #5dc888;
          color: white;
        }

        /* Short Description */
        .product-description-short {
          width: 100%;
          margin: 24px 0 32px 0;
          padding: 24px 32px;
          background: var(--white);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow);
          border: 1px solid var(--gray-light);
          border-left: 4px solid #ea6a18;
        }

        .product-description-short h3 {
          font-size: 18px;
          font-weight: 700;
          color: var(--black);
          font-family: "Poppins", sans-serif;
          margin: 0 0 12px 0;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .product-description-short-content p {
          font-size: 15px;
          line-height: 1.8;
          color: var(--gray-dark);
          margin: 0;
          font-family: "Inter", sans-serif;
        }

        .show-full-description-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-top: 12px;
          padding: 8px 16px;
          background: transparent;
          border: 1.5px solid var(--primary);
          border-radius: 50px;
          color: var(--primary);
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          transition: var(--transition);
          cursor: pointer;
        }

        .show-full-description-link:hover {
          background: var(--primary);
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(232, 93, 58, 0.3);
        }

        .show-full-description-link i {
          font-size: 12px;
          transition: transform 0.3s ease;
        }

        .show-full-description-link:hover i {
          transform: translateY(2px);
        }

        /* Tabs + Form */
        .product-detail-bottom {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 30px;
          margin-top: 40px;
          align-items: start;
        }

        .request-form-card {
          background: white;
          border-radius: 20px;
          padding: 23px;
          box-shadow: 0px 7px 25px rgba(0, 0, 0, 0.1);
          width: 100%;
        }

        .request-form-card h3 {
          font-size: 18px;
          font-weight: 600;
          color: #000;
          font-family: "Poppins", sans-serif;
          margin: 0 0 16px 0;
          text-align: center;
        }

        .request-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .form-group.full-width {
          grid-column: 1 / -1;
        }

        .form-group label {
          font-size: 14px;
          font-weight: 400;
          color: #000;
          font-family: "Poppins", sans-serif;
        }

        .form-group input,
        .form-group textarea {
          width: 100%;
          padding: 8px 12px;
          background: rgba(5, 35, 17, 0.05);
          border: none;
          border-radius: 5px;
          font-family: "Poppins", sans-serif;
          font-size: 14px;
          color: #052311;
          transition: all 0.3s ease;
          min-height: 27px;
        }

        .form-group input:focus,
        .form-group textarea:focus {
          outline: none;
          background: rgba(5, 35, 17, 0.08);
          box-shadow: 0 0 0 2px #ea6a18;
        }

        .form-group textarea {
          resize: vertical;
          min-height: 58px;
        }

        .submit-btn {
          width: 100%;
          padding: 12px;
          background: #ea6a18;
          border: none;
          border-radius: 10px;
          color: white;
          font-size: 18px;
          font-weight: 400;
          font-family: "Poppins", sans-serif;
          box-shadow:
            4px 4px 7.7px rgba(255, 255, 255, 0.25) inset,
            0px 4px 15px rgba(234, 106, 24, 0.5);
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: 4px;
        }

        .submit-btn:hover {
          background: #d95d14;
          transform: translateY(-2px);
          box-shadow:
            4px 4px 7.7px rgba(255, 255, 255, 0.25) inset,
            0px 6px 20px rgba(234, 106, 24, 0.6);
        }

        /* Responsive */
        @media (max-width: 1200px) {
          .product-detail-row {
            flex-direction: column;
            align-items: center;
          }
          .supplier-card {
            width: 100%;
            max-width: 400px;
          }
        }

        @media (max-width: 768px) {
          .product-detail-bottom {
            grid-template-columns: 1fr;
            gap: 20px;
          }
          .product-description-short {
            padding: 16px 20px;
            margin: 16px 0 24px 0;
          }
          .product-specs-grid {
            grid-template-columns: 1fr;
            gap: 15px;
          }
          .request-form-card {
            width: 100%;
          }
          .form-row {
            grid-template-columns: 1fr;
          }
          .product-title {
            font-size: 20px;
          }
          .product-meta {
            gap: 8px;
          }
          .product-share-btn,
          .product-save-btn {
            font-size: 12px;
            padding: 2px 6px;
          }
          .breadcrumb-list {
            font-size: 12px;
          }
        }

        @media (max-width: 480px) {
          .product-title {
            font-size: 18px;
            line-height: 28px;
          }
          .product-date {
            font-size: 12px;
          }
          .product-divider {
            height: 14px;
          }
          .product-specs-column {
            gap: 16px;
          }
          .product-spec-item {
            padding-left: 10px;
          }
          .supplier-card {
            padding-bottom: 12px;
          }
        }
      `}</style>
    </>
  );
}
