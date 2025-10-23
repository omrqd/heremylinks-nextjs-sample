'use client';

import { useEffect } from 'react';

export default function ScrollAnimation() {
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    const animateElements = document.querySelectorAll(
      '.features-section, .feature-card, .analytics-section, .analytics-left, .analytics-right, .get-started-section, .footer'
    );

    animateElements.forEach(element => {
      element.classList.add('animate-on-scroll');
      observer.observe(element);
    });

    // Stagger animation for feature cards
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach((card, index) => {
      (card as HTMLElement).style.transitionDelay = `${index * 0.15}s`;
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  return null;
}

