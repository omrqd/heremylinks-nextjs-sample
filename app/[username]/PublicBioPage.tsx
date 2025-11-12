'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import styles from './public-bio.module.css';

interface User {
  username: string;
  name: string;
  bio: string;
  profileImage: string;
  heroImage: string;
  heroHeight: number;
  hideProfilePicture: boolean;
  themeColor: string;
  backgroundColor: string;
  template: string;
  backgroundImage: string;
  backgroundVideo: string;
  cardBackgroundColor: string;
  cardBackgroundImage: string;
  cardBackgroundVideo: string;
  customText: string;
  usernameColor: string;
  bioColor: string;
  customTextColor: string;
}

interface BioLink {
  id: string;
  title: string;
  url: string;
  icon?: string | null;
  image?: string | null;
  layout?: string | null;
  backgroundColor?: string | null;
  textColor?: string | null;
  isTransparent?: boolean;
}

interface SocialLink {
  id: string;
  platform: string;
  url: string;
  icon: string;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  product_type: string;
  quantity: number | null;
}

interface CartItem extends Product {
  cartQuantity: number;
}

interface PublicBioPageProps {
  user: User;
  links: BioLink[];
  socials: SocialLink[];
  isPremium: boolean;
}

export default function PublicBioPage({ user, links, socials, isPremium }: PublicBioPageProps) {
  // Video refs for Safari compatibility
  const pageVideoRef = useRef<HTMLVideoElement>(null);
  const cardVideoRef = useRef<HTMLVideoElement>(null);
  
  // Products and cart state
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [activeTab, setActiveTab] = useState<'links' | 'shop'>('links');
  const [sellerId, setSellerId] = useState<string>('');
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(`/api/users/${user.username}/products`);
        if (response.ok) {
          const data = await response.json();
          setProducts(data.products || []);
          setSellerId(data.sellerId || '');
          // Auto-switch to shop tab if there are products and no links
          if (data.products.length > 0 && links.length === 0) {
            setActiveTab('shop');
          }
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoadingProducts(false);
      }
    };
    
    fetchProducts();
  }, [user.username, links.length]);

  // Page view tracking with heartbeat
  useEffect(() => {
    // Don't track page views when loaded in iframe (template previews)
    const isInIframe = window.self !== window.top;
    if (isInIframe) {
      console.log('🚫 [Page View] Skipping tracking - page loaded in iframe (template preview)');
      return;
    }
    
    // Generate unique session ID
    const sessionId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log('👁️ [Page View] Initializing tracking for session:', sessionId);
    
    // Track initial page view
    const trackPageView = async () => {
      try {
        await fetch('/api/track/page-view', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: user.username,
            sessionId: sessionId,
          }),
        });
        console.log('💚 [Page View] Heartbeat sent');
      } catch (error) {
        console.error('❌ [Page View] Tracking failed:', error);
      }
    };
    
    // Initial tracking
    trackPageView();
    
    // Send heartbeat every 15 seconds to keep session alive
    const heartbeatInterval = setInterval(trackPageView, 15000);
    
    // Cleanup on unmount
    return () => {
      console.log('👋 [Page View] Session ending:', sessionId);
      clearInterval(heartbeatInterval);
    };
  }, [user.username]);

  // Safari video compatibility - ensure videos loop infinitely
  useEffect(() => {
    const handleVideoLoop = (videoElement: HTMLVideoElement | null) => {
      if (!videoElement) return;

      const playVideo = () => {
        videoElement.play().catch(err => {
          console.log('Video autoplay prevented:', err);
        });
      };

      const handleEnded = () => {
        videoElement.currentTime = 0;
        playVideo();
      };

      // Force play on mount
      playVideo();

      // Add ended event listener to restart video (Safari fallback)
      videoElement.addEventListener('ended', handleEnded);

      return () => {
        videoElement.removeEventListener('ended', handleEnded);
      };
    };

    const cleanupPage = handleVideoLoop(pageVideoRef.current);
    const cleanupCard = handleVideoLoop(cardVideoRef.current);

    return () => {
      cleanupPage?.();
      cleanupCard?.();
    };
  }, [user.backgroundVideo, user.cardBackgroundVideo]);

  const handleLinkClick = async (linkId: string, url: string) => {
    // Don't track clicks when in iframe (template preview)
    const isInIframe = window.self !== window.top;
    
    // Track link click (optional analytics) - skip if in iframe
    if (!isInIframe) {
      try {
        await fetch('/api/track/click', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ linkId }),
        });
      } catch (error) {
        console.error('Failed to track click:', error);
      }
    } else {
      console.log('🚫 [Link Click] Skipping tracking - in iframe (template preview)');
    }

    // Ensure URL has protocol
    let formattedUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      formattedUrl = 'https://' + url;
    }

    // Open link
    window.open(formattedUrl, '_blank', 'noopener,noreferrer');
  };

  // Cart functions
  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        // Check if we can add more (respect quantity limit)
        if (product.quantity !== null && existingItem.cartQuantity >= product.quantity) {
          alert('Maximum quantity reached for this product');
          return prevCart;
        }
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, cartQuantity: item.cartQuantity + 1 }
            : item
        );
      } else {
        return [...prevCart, { ...product, cartQuantity: 1 }];
      }
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCart(prevCart =>
      prevCart.map(item => {
        if (item.id === productId) {
          // Check quantity limit
          if (item.quantity !== null && quantity > item.quantity) {
            alert('Maximum quantity reached for this product');
            return item;
          }
          return { ...item, cartQuantity: quantity };
        }
        return item;
      })
    );
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.cartQuantity), 0);
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    // Redirect to checkout page with cart data
    const cartData = encodeURIComponent(JSON.stringify(cart));
    window.location.href = `/checkout/${sellerId}?cart=${cartData}`;
  };

  const hasProducts = products.length > 0;
  const showTabs = links.length > 0 && hasProducts;

  return (
    <div 
      className={styles.publicBioContainer} 
      style={{ 
        backgroundColor: user.backgroundColor,
        backgroundImage: user.backgroundImage ? `url(${user.backgroundImage})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        position: 'relative'
      }}
    >
      {/* Page Background Video */}
      {user.backgroundVideo && (
        <video
          ref={pageVideoRef}
          autoPlay
          loop
          muted
          playsInline
          webkit-playsinline="true"
          preload="auto"
          className={styles.backgroundVideo}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 0,
          }}
        >
          <source src={user.backgroundVideo} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      )}

      <div 
        className={`${styles.bioCard} ${
          user.template === 'template1' ? styles.template1 : 
          user.template === 'template2' ? styles.template2 : 
          user.template === 'template3' ? styles.template3 : ''
        }`}
        style={{
          // For template3, always use black background - don't apply cardBackgroundColor
          backgroundColor: user.template === 'template3' ? '#000000' : user.cardBackgroundColor,
          backgroundImage: user.cardBackgroundImage ? `url(${user.cardBackgroundImage})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Hero Image Section - Template 3 Only */}
        {user.template === 'template3' && (
          <div className={styles.heroImageWrapper} style={{ height: `${user.heroHeight}px` }}>
            {user.heroImage ? (
              <img src={user.heroImage} alt="Hero banner" className={styles.heroImage} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}></div>
            )}
            <div className={styles.heroGradient}></div>
          </div>
        )}

        {/* Card Background Video */}
        {user.cardBackgroundVideo && (
          <video
            ref={cardVideoRef}
            autoPlay
            loop
            muted
            playsInline
            webkit-playsinline="true"
            preload="auto"
            className={styles.cardBackgroundVideo}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              zIndex: 0,
              borderRadius: '24px',
            }}
          >
            <source src={user.cardBackgroundVideo} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        )}
        {/* Profile Section */}
        <div className={styles.profileSection}>
          {/* Conditionally hide profile picture in template3 */}
          {!(user.template === 'template3' && user.hideProfilePicture) && (
            <div className={styles.profileImageWrapper}>
              {user.profileImage ? (
                <img src={user.profileImage} alt={user.name} className={styles.profileImage} />
              ) : (
                <div className={styles.profilePlaceholder} style={{ background: user.themeColor }}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          )}

          <h1 className={styles.profileName} style={{ color: user.usernameColor }}>
            {user.name}
            {user.template === 'template3' && isPremium && (
              <span className={styles.verifiedBadge}>
                <i className="fas fa-check"></i>
              </span>
            )}
          </h1>
          
          {/* @username handle - Template 3 Only */}
          {user.template === 'template3' && (
            <div className={styles.usernameHandle}>
              @{user.username}
            </div>
          )}

          {/* Social Icons - Moved before bio */}
          {socials.length > 0 && (
            <div className={styles.socialIconsContainer}>
              {socials.map((social) => (
                <a
                  key={social.id}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialIcon}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLinkClick(social.id, social.url);
                  }}
                  title={social.platform}
                >
                  <i className={social.icon}></i>
                </a>
              ))}
            </div>
          )}
          
          {user.bio && <p className={styles.profileBio} style={{ color: user.bioColor }}>{user.bio}</p>}
        </div>

        {/* Tab Navigation - Show only if both links and products exist */}
        {showTabs && (
          <div className={styles.tabNavigation}>
            <button
              className={`${styles.tab} ${activeTab === 'links' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('links')}
              style={{
                borderBottomColor: activeTab === 'links' ? user.themeColor : 'transparent'
              }}
            >
              <i className="fas fa-link"></i>
              <span>Links</span>
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'shop' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('shop')}
              style={{
                borderBottomColor: activeTab === 'shop' ? user.themeColor : 'transparent'
              }}
            >
              <i className="fas fa-shopping-bag"></i>
              <span>Shop</span>
              {cart.length > 0 && (
                <span className={styles.cartBadge} style={{ backgroundColor: user.themeColor }}>
                  {cart.length}
                </span>
              )}
            </button>
          </div>
        )}

        {/* Links Section */}
        {(!showTabs || activeTab === 'links') && (
        <div className={styles.linksSection}>
          {links.length === 0 ? (
            <div className={styles.noLinks}>
              <i className="fas fa-link"></i>
              <p>No links yet</p>
            </div>
          ) : (
            links.map((link) => {
              const layoutClass = link.layout
                ? styles[`layout${link.layout.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')}`]
                : styles.layoutSimple;

              const isTemplate3 = user.template === 'template3';
              const shouldUseBackgroundImage = isTemplate3 && link.image && (
                link.layout === 'image-top' || 
                link.layout === 'image-top-left' || 
                link.layout === 'image-top-right' || 
                link.layout === 'image-large'
              );
              const hasImageBackground = shouldUseBackgroundImage;

              const linkStyle = {
                // For template3 background images, make transparent by default
                backgroundColor: shouldUseBackgroundImage ? 'transparent' : (link.isTransparent ? 'transparent' : (link.backgroundColor || '#ffffff')),
                // For template3, remove all borders
                ...(isTemplate3 ? {
                  border: 'none',
                  borderColor: 'transparent',
                } : {
                borderColor: link.isTransparent ? 'rgba(255, 255, 255, 0.3)' : user.themeColor,
                border: link.isTransparent ? '2px solid rgba(255, 255, 255, 0.3)' : `2px solid ${user.themeColor}`,
                }),
                // For template3, apply image as background for specific layouts
                ...(shouldUseBackgroundImage && {
                  backgroundImage: `url(${link.image})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                }),
              };

              return (
                <button
                  key={link.id}
                  className={`${styles.bioLink} ${layoutClass} ${hasImageBackground ? styles.hasImage : ''}`}
                  onClick={() => handleLinkClick(link.id, link.url)}
                  style={linkStyle}
                >
                  {/* Template3: Render icon badge in top-right and title in bottom-left */}
                  {isTemplate3 && hasImageBackground ? (
                    <>
                      {link.icon && (
                        <i className={`${link.icon} ${styles.linkIcon}`}></i>
                      )}
                      <span className={styles.linkTitle}>{link.title}</span>
                    </>
                  ) : (
                    <>
                      {/* Image Left Layout */}
                      {link.image && link.layout === 'image-left' && (
                        <div className={styles.linkImageLeft}>
                          <img src={link.image} alt={link.title} />
                        </div>
                      )}

                      {/* Image Top Layouts */}
                      {link.image && (link.layout === 'image-top' || link.layout === 'image-top-left' || link.layout === 'image-top-right' || link.layout === 'image-large') && (
                        <div className={styles.linkImageTop}>
                          <img src={link.image} alt={link.title} />
                        </div>
                      )}

                      <div className={styles.linkContent}>
                        {link.icon && !link.image && (
                          <i className={`${link.icon} ${styles.linkIcon}`} style={{ color: link.textColor || user.themeColor }}></i>
                        )}
                        <span className={styles.linkTitle} style={{ color: link.textColor || '#1a1a1a' }}>{link.title}</span>
                      </div>

                      {/* Image Right Layout */}
                      {link.image && link.layout === 'image-right' && (
                        <div className={styles.linkImageRight}>
                          <img src={link.image} alt={link.title} />
                        </div>
                      )}

                      <i className="fas fa-arrow-right" style={{ color: user.themeColor }}></i>
                    </>
                  )}
                </button>
              );
            })
          )}
        </div>
        )}

        {/* Products Section */}
        {(!showTabs || activeTab === 'shop') && hasProducts && (
          <div className={styles.productsSection}>
            {loadingProducts ? (
              <div className={styles.loadingProducts}>
                <i className="fas fa-spinner fa-spin"></i>
                <p>Loading products...</p>
              </div>
            ) : products.length === 0 ? (
              <div className={styles.noProducts}>
                <i className="fas fa-box-open"></i>
                <p>No products available</p>
              </div>
            ) : (
              <>
                {/* Product Links styled like bioLinks */}
                {products.map((product) => (
                  <button
                    key={product.id}
                    className={styles.productLink}
                    onClick={() => addToCart(product)}
                    disabled={product.quantity !== null && product.quantity === 0}
                    style={{
                      backgroundImage: product.image ? `url(${product.image})` : 'none',
                      backgroundColor: product.image ? 'transparent' : '#ffffff',
                      borderColor: user.themeColor,
                      cursor: product.quantity !== null && product.quantity === 0 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {/* Overlay for better text readability */}
                    {product.image && <div className={styles.productOverlay}></div>}
                    
                    <div className={styles.productLinkContent}>
                      <div className={styles.productLinkInfo}>
                        <h3 className={styles.productLinkTitle}>{product.name}</h3>
                        <p className={styles.productLinkPrice} style={{ color: product.image ? '#ffffff' : user.themeColor }}>
                          ${product.price.toFixed(2)}
                          {product.product_type === 'digital' && (
                            <span className={styles.digitalTag}>
                              <i className="fas fa-download"></i> Digital
                            </span>
                          )}
                        </p>
                      </div>
                      {product.quantity !== null && product.quantity === 0 ? (
                        <div className={styles.outOfStock}>
                          <i className="fas fa-times-circle"></i>
                          <span>Out of Stock</span>
                        </div>
                      ) : (
                        <div className={styles.addToCartIcon} style={{ 
                          backgroundColor: product.image ? 'rgba(255, 255, 255, 0.9)' : user.themeColor,
                          color: product.image ? user.themeColor : '#ffffff'
                        }}>
                          <i className="fas fa-cart-plus"></i>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
                
                {/* Cart Summary Button - at bottom of products list */}
                {cart.length > 0 && (
                  <button
                    className={styles.viewCartButton}
                    onClick={() => setShowCart(true)}
                    style={{
                      backgroundColor: user.themeColor,
                      borderColor: user.themeColor
                    }}
                  >
                    <i className="fas fa-shopping-cart"></i>
                    <span>View Cart ({cart.length} {cart.length === 1 ? 'item' : 'items'})</span>
                    <span className={styles.cartTotal}>${getTotalPrice().toFixed(2)}</span>
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {/* Custom Text Section */}
        {user.customText && (
          <div className={styles.customTextSection}>
            <p className={styles.customText} style={{ color: user.customTextColor }}>{user.customText}</p>
          </div>
        )}

        {/* Cart Modal */}
        {showCart && (
          <div className={styles.cartModalOverlay} onClick={() => setShowCart(false)}>
            <div className={styles.cartModal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.cartHeader}>
                <h2 className={styles.cartTitle}>
                  <i className="fas fa-shopping-cart"></i> Your Cart
                </h2>
                <button
                  className={styles.cartClose}
                  onClick={() => setShowCart(false)}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <div className={styles.cartContent}>
                {cart.length === 0 ? (
                  <div className={styles.emptyCart}>
                    <i className="fas fa-shopping-cart"></i>
                    <p>Your cart is empty</p>
                  </div>
                ) : (
                  <>
                    <div className={styles.cartItems}>
                      {cart.map((item) => (
                        <div key={item.id} className={styles.cartItem}>
                          {item.image && (
                            <img src={item.image} alt={item.name} className={styles.cartItemImage} />
                          )}
                          <div className={styles.cartItemInfo}>
                            <h4 className={styles.cartItemName}>{item.name}</h4>
                            <p className={styles.cartItemPrice}>${item.price.toFixed(2)}</p>
                          </div>
                          <div className={styles.cartItemActions}>
                            <div className={styles.quantityControl}>
                              <button
                                onClick={() => updateCartQuantity(item.id, item.cartQuantity - 1)}
                                className={styles.quantityButton}
                              >
                                <i className="fas fa-minus"></i>
                              </button>
                              <span className={styles.quantityValue}>{item.cartQuantity}</span>
                              <button
                                onClick={() => updateCartQuantity(item.id, item.cartQuantity + 1)}
                                className={styles.quantityButton}
                                disabled={item.quantity !== null && item.cartQuantity >= item.quantity}
                              >
                                <i className="fas fa-plus"></i>
                              </button>
                            </div>
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className={styles.removeButton}
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className={styles.cartFooter}>
                      <div className={styles.cartTotal}>
                        <span className={styles.cartTotalLabel}>Total:</span>
                        <span className={styles.cartTotalAmount} style={{ color: user.themeColor }}>
                          ${getTotalPrice().toFixed(2)}
                        </span>
                      </div>
                      <button
                        className={styles.checkoutButton}
                        onClick={handleCheckout}
                        style={{
                          backgroundColor: user.themeColor,
                          borderColor: user.themeColor
                        }}
                      >
                        <i className="fas fa-lock"></i> Proceed to Checkout
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className={styles.footer}>
          {!isPremium ? (
            /* Promo Banner for Non-Premium Users */
            <a 
              href="https://heremylinks.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className={styles.promoBanner}
            >
              <div className={styles.promoBannerContent}>
                <Image 
                  src={user.template === 'template3' ? "/imgs/white-logo.png" : "/imgs/logo.png"} 
                  alt="HereMyLinks" 
                  width={100} 
                  height={25}
                  className={styles.promoBannerLogo}
                />
                <div className={styles.promoBannerText}>
                  <span className={styles.promoBannerTitle}>Create Your Own!</span>
                  <span className={styles.promoBannerSubtitle}>Build beautiful bio link pages like this</span>
                </div>
                <i className="fas fa-arrow-right"></i>
              </div>
            </a>
          ) : (
            /* Regular Footer Link for Premium Users */
            <a href="/" className={styles.footerLink}>
              <Image 
                src={user.template === 'template3' ? "/imgs/white-logo.png" : "/imgs/logo.png"} 
                alt="HereMyLinks" 
                width={120} 
                height={30} 
              />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

