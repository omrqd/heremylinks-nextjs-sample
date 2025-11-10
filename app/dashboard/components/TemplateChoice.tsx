"use client";
import React, { useState, useEffect } from "react";
import styles from "./TemplateChoice.module.css";

type TemplateId = "template1" | "template3";

interface TemplateChoiceProps {
  isOpen: boolean;
  defaultTemplate?: TemplateId;
  onApply: (templateId: TemplateId) => Promise<void> | void;
  onClose: () => void;
}

export default function TemplateChoice({
  isOpen,
  defaultTemplate = "template3",
  onApply,
  onClose,
}: TemplateChoiceProps) {
  const [selected, setSelected] = useState<TemplateId>(defaultTemplate);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setSelected(defaultTemplate);
  }, [defaultTemplate, isOpen]);

  const handleApply = async () => {
    try {
      setIsSubmitting(true);
      await onApply(selected);
      onClose();
    } catch (e) {
      // Parent should handle toasts; we just stop the submitting state
      console.error("Failed to apply template", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Choose your template</h3>
        </div>
        <div className={styles.modalBody}>
          <p className={styles.modalDescription}>
            Pick a starting look for your page. You can change it anytime.
          </p>

          <div className={styles.templatesGrid}>
            {/* Classic template (template1) */}
            <button
              type="button"
              className={`${styles.templateCard} ${
                selected === "template1" ? styles.templateCardActive : ""
              }`}
              onClick={() => setSelected("template1")}
              disabled={isSubmitting}
              aria-pressed={selected === "template1"}
            >
              <div className={styles.templatePreview}>
                <div className={styles.templatePreviewBold}>
                  <div className={styles.previewCircle}></div>
                  <div className={styles.previewLine}></div>
                  <div className={styles.previewLine}></div>
                  <div className={styles.previewButtonBold}></div>
                  <div className={styles.previewButtonBold}></div>
                </div>
              </div>
              <div className={styles.templateInfo}>
                <div className={styles.templateName}>Classic Template</div>
                <p className={styles.templateDescription}>Clean white background with bold borders</p>
              </div>
            </button>

            {/* Influencer hero (template3) - default */}
            <button
              type="button"
              className={`${styles.templateCard} ${
                selected === "template3" ? styles.templateCardActive : ""
              }`}
              onClick={() => setSelected("template3")}
              disabled={isSubmitting}
              aria-pressed={selected === "template3"}
            >
              <div className={styles.templatePreview}>
                <div className={styles.templatePreviewHero}>
                  <div className={styles.previewHeroImage}></div>
                  <div className={styles.previewCircle}></div>
                  <div className={styles.previewLine}></div>
                  <div className={styles.previewGridCards}>
                    <div className={styles.previewGridCard}></div>
                    <div className={styles.previewGridCard}></div>
                    <div className={styles.previewGridCard}></div>
                    <div className={styles.previewGridCard}></div>
                  </div>
                </div>
              </div>
              <div className={styles.templateInfo}>
                <div className={styles.templateName}>Influencer Hero</div>
                <p className={styles.templateDescription}>Modern hero image with grid-based link cards</p>
              </div>
            </button>
          </div>
        </div>
        <div className={styles.modalFooter}>
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={onClose}
            disabled={isSubmitting}
          >
            Maybe later
          </button>
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={handleApply}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Applying..." : "Apply template"}
          </button>
        </div>
      </div>
    </div>
  );
}