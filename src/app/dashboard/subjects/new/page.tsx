"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { SUBJECT_COLORS, CreateSubjectFormData } from "@/types/subject";
import { ArrowLeft, Save, X, Palette, Upload } from "lucide-react";
import { handleAutoCapitalize } from "@/lib/stringUtils";
import SubjectFileUpload from "@/components/subject/SubjectFileUpload";
import { uploadSubjectFiles, updateSubjectFileCount } from "@/lib/subjectFiles";

export default function NewSubjectPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState<CreateSubjectFormData>({
    name: "",
    code: "",
    description: "",
    color: SUBJECT_COLORS[0],
    teacher: "",
    room: "",
    selectedFiles: [],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Subject name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Subject name must be at least 2 characters";
    }

    if (formData.code && formData.code.trim().length < 2) {
      newErrors.code = "Subject code must be at least 2 characters";
    }

    if (formData.description && formData.description.trim().length < 10) {
      newErrors.description = "Description must be at least 10 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setIsUploadingFiles(true);
    setUploadProgress(0);

    try {
      // Import Firebase functions
      const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
      const { getDb } = await import('@/lib/firebase');

      // Step 1: Create subject first
      const newSubject = {
        userId: user?.userId,
        name: formData.name,
        code: formData.code,
        description: formData.description,
        color: formData.color,
        teacher: formData.teacher,
        room: formData.room,
        isActive: true,
        fileCount: 0, // Initialize with 0, will be updated if files are uploaded
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Save to Firebase Firestore
      const db = getDb();
      const subjectId = Date.now().toString();
      const subjectRef = doc(db, 'subjects', subjectId);
      await setDoc(subjectRef, newSubject);

      // Step 2: Upload files if any were selected
      if (formData.selectedFiles && formData.selectedFiles.length > 0) {
        try {
          const uploadedFiles = await uploadSubjectFiles(
            formData.selectedFiles,
            subjectId,
            user?.userId || '',
            (progress) => {
              setUploadProgress(progress);
            }
          );

          // Step 3: Update subject with file count
          await updateSubjectFileCount(subjectId);

        } catch (fileError) {
          console.error('Failed to upload files:', fileError);
          // Don't fail the entire subject creation if file upload fails
          // Subject is already created, just log the error
        }
      }

      // Simulate API delay for better UX
      if (uploadProgress < 100) {
        await new Promise(resolve => setTimeout(resolve, 1000 - uploadProgress * 10));
      }

      // Redirect to subjects list
      router.push("/dashboard/subjects");

    } catch (error) {
      console.error('Subject creation error:', error);
      setErrors({ submit: "Failed to create subject. Please try again." });
    } finally {
      setIsSubmitting(false);
      setIsUploadingFiles(false);
      setUploadProgress(0);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name } = e.target;

    // Apply auto-capitalization to specific fields
    let value = e.target.value;
    if (name === 'name' || name === 'code' || name === 'teacher' || name === 'room') {
      value = handleAutoCapitalize(e, true);
    }

    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleColorSelect = (color: string) => {
    setFormData(prev => ({ ...prev, color }));
  };

  const handleFilesChange = (files: File[]) => {
    setFormData(prev => ({ ...prev, selectedFiles: files }));
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Header */}
      <div className="row" style={{ marginBottom: '24px', alignItems: 'center' }}>
        <button
          onClick={() => router.back()}
          className="btn ghost"
          style={{ marginRight: '16px', padding: '8px' }}
        >
          <ArrowLeft size={16} />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 'var(--fs-h1)', margin: '0 0 4px', color: 'var(--text)' }}>
            Add New Subject
          </h1>
          <p className="small" style={{ color: 'var(--text-2)' }}>
            Create a new subject to organize your academic materials
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="card">
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gap: '20px' }}>

            {/* Subject Name */}
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: 'var(--text)' }}>
                Subject Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Mathematics, Physics, Chemistry"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: `1px solid ${errors.name ? 'var(--danger)' : 'var(--border)'}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  background: 'var(--card)',
                  color: 'var(--text)'
                }}
                disabled={isSubmitting}
              />
              {errors.name && (
                <div className="small" style={{ color: 'var(--danger)', marginTop: '4px' }}>
                  {errors.name}
                </div>
              )}
            </div>

            {/* Subject Code */}
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: 'var(--text)' }}>
                Subject Code
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                placeholder="e.g., MATH101, PHY201"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: `1px solid ${errors.code ? 'var(--danger)' : 'var(--border)'}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  background: 'var(--card)',
                  color: 'var(--text)'
                }}
                disabled={isSubmitting}
              />
              {errors.code && (
                <div className="small" style={{ color: 'var(--danger)', marginTop: '4px' }}>
                  {errors.code}
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: 'var(--text)' }}>
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Brief description of the subject, topics covered, etc."
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: `1px solid ${errors.description ? 'var(--danger)' : 'var(--border)'}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  background: 'var(--card)',
                  color: 'var(--text)',
                  resize: 'vertical'
                }}
                disabled={isSubmitting}
              />
              {errors.description && (
                <div className="small" style={{ color: 'var(--danger)', marginTop: '4px' }}>
                  {errors.description}
                </div>
              )}
            </div>

            {/* Teacher and Room */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: 'var(--text)' }}>
                  Teacher
                </label>
                <input
                  type="text"
                  name="teacher"
                  value={formData.teacher}
                  onChange={handleInputChange}
                  placeholder="Teacher's name"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    background: 'var(--card)',
                    color: 'var(--text)'
                  }}
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: 'var(--text)' }}>
                  Room
                </label>
                <input
                  type="text"
                  name="room"
                  value={formData.room}
                  onChange={handleInputChange}
                  placeholder="Room number"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    background: 'var(--card)',
                    color: 'var(--text)'
                  }}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Color Selection */}
            <div>
              <label style={{ display: 'block', marginBottom: '12px', fontWeight: '500', color: 'var(--text)' }}>
                <Palette size={16} style={{ display: 'inline-block', marginRight: '6px' }} />
                Subject Color
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {SUBJECT_COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => handleColorSelect(color)}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      border: formData.color === color ? '3px solid var(--text)' : '2px solid var(--border)',
                      background: color,
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      opacity: isSubmitting ? 0.6 : 1,
                      transition: 'all 0.2s ease'
                    }}
                    disabled={isSubmitting}
                  />
                ))}
              </div>
            </div>

            {/* Subject Files */}
            <div>
              <label style={{ display: 'block', marginBottom: '12px', fontWeight: '500', color: 'var(--text)' }}>
                <Upload size={16} style={{ display: 'inline-block', marginRight: '6px' }} />
                Subject Files (Optional)
              </label>
              <div style={{ fontSize: '13px', color: 'var(--text-2)', marginBottom: '12px' }}>
                Upload initial materials for this subject (syllabus, notes, references, etc.)
              </div>
              <SubjectFileUpload
                userId={user?.userId || ''}
                onFilesChange={handleFilesChange}
                maxFiles={10}
                disabled={isSubmitting}
              />
            </div>

            {/* Upload Progress */}
            {isUploadingFiles && uploadProgress > 0 && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                padding: '16px',
                background: 'var(--brand-50)',
                border: '1px solid var(--brand-200)',
                borderRadius: '8px'
              }}>
                <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--brand)' }}>
                  Uploading subject files...
                </div>
                <div style={{
                  width: '100%',
                  height: '8px',
                  background: 'var(--brand-100)',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${uploadProgress}%`,
                    height: '100%',
                    background: 'var(--brand)',
                    borderRadius: '4px',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
                <div className="small" style={{ color: 'var(--brand)' }}>
                  {uploadProgress.toFixed(1)}% complete
                </div>
              </div>
            )}

            {/* Preview */}
            <div>
              <label style={{ display: 'block', marginBottom: '12px', fontWeight: '500', color: 'var(--text)' }}>
                Preview
              </label>
              <div className="card" style={{
                borderLeft: `4px solid ${formData.color}`,
                padding: '16px',
                background: `${formData.color}15`
              }}>
                <div className="row" style={{ alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: formData.color,
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '600',
                    fontSize: '14px'
                  }}>
                    {formData.code ? formData.code.substring(0, 2).toUpperCase() : formData.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', color: 'var(--text)' }}>
                      {formData.name || "Subject Name"}
                    </div>
                    <div className="small" style={{ color: 'var(--text-2)' }}>
                      {formData.code && `${formData.code} • `}
                      {formData.teacher && `Prof. ${formData.teacher}`}
                      {formData.code && formData.teacher && " • "}
                      {formData.room && `Room ${formData.room}`}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {errors.submit && (
              <div className="card" style={{ background: 'var(--danger)', color: 'white', padding: '12px' }}>
                {errors.submit}
              </div>
            )}

            {/* Actions */}
            <div className="hr" />

            <div className="row" style={{ justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                onClick={() => router.back()}
                className="btn ghost"
                disabled={isSubmitting || isUploadingFiles}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn"
                disabled={isSubmitting || isUploadingFiles}
                style={{ minWidth: '120px' }}
              >
                {isUploadingFiles ? (
                  <>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid white',
                      borderTop: '2px solid transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                      marginRight: '8px'
                    }} />
                    Uploading Files...
                  </>
                ) : isSubmitting ? (
                  <>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid white',
                      borderTop: '2px solid transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                      marginRight: '8px'
                    }} />
                    Creating Subject...
                  </>
                ) : (
                  <>
                    <Save size={16} style={{ marginRight: '8px' }} />
                    Create Subject
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}