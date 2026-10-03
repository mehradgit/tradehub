// src/components/home/WhyFoodTradeLink.js
export default function WhyFoodTradeLink() {
  const items = [
    {
      icon: "fa-shield-halved",
      title: "Verified Businesses",
      description: "Know who you're trading with.",
    },
    {
      icon: "fa-globe",
      title: "Global Suppliers",
      description: "Discover food producers worldwide.",
    },
    {
      icon: "fa-comments",
      title: "Direct Communication",
      description: "Talk directly with buyers and suppliers.",
    },
    {
      icon: "fa-cart-shopping",
      title: "Trade Requests",
      description: "Find active buying opportunities.",
    },
  ];

  return (
    <section className="why-ftl">
      <div className="container">
        <h2 className="why-ftl-heading">
          Why FoodTradeLink?
        </h2>

        <div className="why-ftl-grid">
          {items.map((item, i) => (
            <div key={i} className="why-ftl-item">
              <div className="why-ftl-icon">
                <i className={`fa-solid ${item.icon}`}></i>
              </div>
              <div className="why-ftl-text">
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}