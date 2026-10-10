import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import KpiCard from "@/components/admin/KpiCard";
import GrowthChart from "@/components/admin/GrowthChart";
import CategoriesDonut from "@/components/admin/CategoriesDonut";
import SafeImage from "@/components/ui/SafeImage";

export default async function AdminDashboard() {
  const session = await auth();
  if (!session?.user?.isAdmin) redirect("/dashboard");

  const [
    userCount,
    supplierCount,
    productCount,
    inquiryCount,
    dealCount,
    recentUsers,
    recentInquiries,
    pendingSuppliers,
    pendingProducts,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "SUPPLIER" } }),
    prisma.product.count({ where: { isVisible: true } }),
    prisma.productInquiry.count(),
    prisma.quote.count({ where: { status: "accepted" } }),
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        country: true,
        role: true,
        plan: true,
        registrationComplete: true,
        profileNumber: true,
        slug: true,
      },
    }),
    prisma.productInquiry.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        product: { select: { name: true, images: true } },
        user: { select: { name: true, companyName: true } },
      },
    }),
    prisma.user.count({ where: { role: "SUPPLIER", registrationComplete: false } }),
    prisma.product.count({ where: { isVisible: false } }),
  ]);

  const categoryData = [
    { label: "Fruits & Vegetables", value: 28, color: "#14986f" },
    { label: "Grains & Cereals", value: 22, color: "#f2a52e" },
    { label: "Dairy & Eggs", value: 16, color: "#4388e9" },
    { label: "Meat & Poultry", value: 12, color: "#8b55e7" },
    { label: "Beverages", value: 10, color: "#66aeb6" },
    { label: "Others", value: 12, color: "#b6c0bd" },
  ];

  return (
    <>
      {/* HERO */}
      <section className="admin-hero">
        <div className="admin-hero-inner">
          <div>
            <div className="hi">🌿 Good morning, {session.user.name || "Admin"} 👋</div>
            <h1>Welcome to FoodTradeLink</h1>
            <p>
              Manage your marketplace, connect with global partners
              <br />
              and grow your food business.
            </p>
          </div>
          <button>
            View Reports &nbsp; →
          </button>
          <div className="admin-hero-meta">
            <div>
              <b>{dealCount}</b>
              <span>Deals this month</span>
            </div>
            <div>
              <b>$186K</b>
              <span>GMV this month</span>
            </div>
            <div>
              <b>24°C</b>
              <span>Isfahan, Iran</span>
            </div>
          </div>
        </div>
      </section>

      {/* KPIs */}
      <section className="admin-kpis">
        <KpiCard
          icon="fa-users"
          iconClass="green-bg"
          label="Users"
          value={userCount.toLocaleString()}
          change="12.5%"
          data={[15, 20, 18, 27, 23, 31, 29, 38]}
        />
        <KpiCard
          icon="fa-truck"
          iconClass="orange-bg"
          label="Suppliers"
          value={supplierCount.toLocaleString()}
          change="8.4%"
          data={[10, 12, 12, 18, 16, 22, 20, 28]}
        />
        <KpiCard
          icon="fa-cube"
          iconClass="blue-bg"
          label="Products"
          value={productCount.toLocaleString()}
          change="8.2%"
          data={[13, 16, 14, 22, 20, 28, 26, 35]}
        />
        <KpiCard
          icon="fa-comments"
          iconClass="purple-bg"
          label="Inquiries"
          value={inquiryCount.toLocaleString()}
          change="3.1%"
          data={[9, 13, 11, 19, 16, 22, 21, 29]}
        />
      </section>

      {/* TOP CONTENT */}
      <section className="admin-content-top">
        {/* Growth Chart */}
        <div className="admin-card">
          <div className="admin-card-head">
            <div>
              <div className="admin-title">Marketplace Growth</div>
              <div className="admin-subtitle">Total activity over the last 6 months</div>
            </div>
            <select className="admin-select">
              <option>Last 6 months</option>
              <option>Last 12 months</option>
            </select>
          </div>
          <GrowthChart />
        </div>

        {/* Marketplace Overview */}
        <div className="admin-card">
          <div className="admin-card-head">
            <div>
              <div className="admin-title">Marketplace Overview</div>
              <div className="admin-subtitle">Live platform snapshot</div>
            </div>
            <i className="fa-solid fa-ellipsis" style={{ color: "#a0aaa5", fontSize: 10 }}></i>
          </div>
          <div className="admin-overview-list">
            <div className="admin-ov">
              <div className="admin-ov-icon blue-bg"><i className="fa-solid fa-user"></i></div>
              <div><b>Active Buyers</b><span>Verified buyers</span></div>
              <div>
                <strong>{userCount - supplierCount}</strong>
                <div className="admin-trend">↑ 6.2%</div>
              </div>
            </div>
            <div className="admin-ov">
              <div className="admin-ov-icon green-bg"><i className="fa-solid fa-truck"></i></div>
              <div><b>Active Suppliers</b><span>Verified suppliers</span></div>
              <div>
                <strong>{supplierCount}</strong>
                <div className="admin-trend">↑ 5.7%</div>
              </div>
            </div>
            <div className="admin-ov">
              <div className="admin-ov-icon blue-bg"><i className="fa-solid fa-cube"></i></div>
              <div><b>Products</b><span>Published listings</span></div>
              <div>
                <strong>{productCount.toLocaleString()}</strong>
                <div className="admin-trend">↑ 8.2%</div>
              </div>
            </div>
            <div className="admin-ov">
              <div className="admin-ov-icon purple-bg"><i className="fa-solid fa-message"></i></div>
              <div><b>Open Inquiries</b><span>Need attention</span></div>
              <div>
                <strong>{inquiryCount.toLocaleString()}</strong>
                <div className="admin-trend">↑ 3.1%</div>
              </div>
            </div>
            <div className="admin-ov">
              <div className="admin-ov-icon orange-bg"><i className="fa-solid fa-handshake"></i></div>
              <div><b>Completed Deals</b><span>This month</span></div>
              <div>
                <strong>{dealCount}</strong>
                <div className="admin-trend">↑ 12.8%</div>
              </div>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="admin-card">
          <div className="admin-card-head">
            <div>
              <div className="admin-title">Top Categories</div>
              <div className="admin-subtitle">Product distribution</div>
            </div>
            <a className="admin-view" href="#">View all</a>
          </div>
          <div className="admin-cat">
            <div className="admin-donut">
              <CategoriesDonut data={categoryData} />
            </div>
            <div className="admin-legend">
              {categoryData.map((cat) => (
                <div className="admin-legend-row" key={cat.label}>
                  <i className="admin-dot" style={{ background: cat.color }}></i>
                  {cat.label}
                  <span>{cat.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* BOTTOM GRID */}
      <section className="admin-bottom-grid">
        {/* Pending Approvals */}
        <div className="admin-card">
          <div className="admin-card-head">
            <div>
              <div className="admin-title">
                Pending Approvals{" "}
                <span style={{ background: "#edf1ef", borderRadius: 15, padding: "3px 6px", fontSize: 7 }}>
                  {pendingSuppliers + pendingProducts}
                </span>
              </div>
            </div>
            <a className="admin-view" href="#">View all</a>
          </div>
          <div className="admin-list">
            <div className="admin-list-item">
              <div className="admin-round green-bg"><i className="fa-solid fa-user-plus"></i></div>
              <div>
                <b>New Supplier Registration</b>
                <p>{pendingSuppliers} pending</p>
              </div>
              <button className="admin-review">Review</button>
            </div>
            <div className="admin-list-item">
              <div className="admin-round orange-bg"><i className="fa-solid fa-box"></i></div>
              <div>
                <b>Product Approvals</b>
                <p>{pendingProducts} pending</p>
              </div>
              <button className="admin-review">Review</button>
            </div>
          </div>
        </div>

        {/* Recent Inquiries */}
        <div className="admin-card">
          <div className="admin-card-head">
            <div><div className="admin-title">Recent Inquiries</div></div>
            <a className="admin-view" href="#">View all</a>
          </div>
          <div className="admin-list">
            {recentInquiries.slice(0, 4).map((inq) => (
              <div className="admin-list-item" key={inq.id}>
                <SafeImage
                  className="admin-inquiry-thumb"
                  src={inq.product?.images?.[0]}
                  alt={inq.product?.name}
                />
                <div>
                  <b>{inq.product?.name || "Product"}</b>
                  <p>Buyer: {inq.user?.companyName || inq.user?.name}</p>
                </div>
                <span className="admin-status new">New</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="admin-card">
          <div className="admin-card-head">
            <div><div className="admin-title">Recent Activity</div></div>
            <a className="admin-view" href="#">View all</a>
          </div>
          <div className="admin-list">
            <div className="admin-list-item">
              <div className="admin-round green-bg"><i className="fa-solid fa-message"></i></div>
              <div><b>New inquiry received</b><p>Olive Oil · 500 tons</p></div>
              <span className="admin-ago">2h ago</span>
            </div>
            <div className="admin-list-item">
              <div className="admin-round blue-bg"><i className="fa-solid fa-user-check"></i></div>
              <div><b>Supplier approved</b><p>Green Valley Foods</p></div>
              <span className="admin-ago">3h ago</span>
            </div>
            <div className="admin-list-item">
              <div className="admin-round purple-bg"><i className="fa-solid fa-user-plus"></i></div>
              <div><b>New user registration</b><p>Global Food Imports</p></div>
              <span className="admin-ago">5h ago</span>
            </div>
            <div className="admin-list-item">
              <div className="admin-round green-bg"><i className="fa-solid fa-box"></i></div>
              <div><b>Product added</b><p>Organic Pomegranate</p></div>
              <span className="admin-ago">6h ago</span>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Users Table */}
      <section className="admin-card admin-users-card" style={{ marginBottom: 13 }}>
        <div className="admin-card-head">
          <div>
            <div className="admin-title">Recent Users</div>
            <div className="admin-subtitle">Newest companies joining the marketplace</div>
          </div>
          <Link href="/admin/users" className="admin-view">View all</Link>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Country</th>
                <th>Type</th>
                <th>Subscription</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="admin-person">
                      <div className="avatar-letter">
                        {(user.name || user.email || "U").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <b>{user.name || "Unnamed"}</b>
                        <span>{user.email}</span>
                      </div>
                    </div>
                  </td>
                  <td>{user.country || "—"}</td>
                  <td>
                    <span className={`admin-pill ${user.role === "SUPPLIER" ? "pending" : ""}`}>
                      {user.role === "SUPPLIER" ? "Supplier" : "Buyer"}
                    </span>
                  </td>
                  <td>
                    <span className={`admin-pill ${user.plan === "GOLD" ? "premium" : user.plan === "FREE" ? "basic" : "active"}`}>
                      {user.plan || "FREE"}
                    </span>
                  </td>
                  <td>
                    <span className={`admin-pill ${user.registrationComplete ? "active" : "pending"}`}>
                      {user.registrationComplete ? "Active" : "Pending"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="admin-card">
        <div className="admin-card-head">
          <div>
            <div className="admin-title">Quick Actions</div>
            <div className="admin-subtitle">Common marketplace tasks</div>
          </div>
        </div>
        <div className="admin-quick">
          <Link href="/admin/products/new">
            <div className="admin-quick-icon green-bg"><i className="fa-solid fa-leaf"></i></div>
            <div><b>Add Product</b><span>List a new product</span></div>
          </Link>
          <Link href="/admin/users">
            <div className="admin-quick-icon blue-bg"><i className="fa-solid fa-users"></i></div>
            <div><b>Find User</b><span>Discover users</span></div>
          </Link>
          <Link href="/admin/inquiries">
            <div className="admin-quick-icon purple-bg"><i className="fa-solid fa-message"></i></div>
            <div><b>View Inquiries</b><span>Manage inquiries</span></div>
          </Link>
          <Link href="/admin/plans">
            <div className="admin-quick-icon orange-bg"><i className="fa-solid fa-crown"></i></div>
            <div><b>Manage Plans</b><span>Edit subscriptions</span></div>
          </Link>
        </div>
      </section>
    </>
  );
}