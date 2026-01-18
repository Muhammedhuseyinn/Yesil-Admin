// src/pages/Categories.jsx
import React, { useEffect, useState } from "react";
import { db, storage } from "../firebase"; // Make sure storage is exported from firebase.js
import { 
  collection, 
  getDocs, 
  doc, 
  deleteDoc, 
  addDoc, 
  updateDoc,
  serverTimestamp 
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"; // Add Firebase Storage
import { 
  MdCategory, 
  MdRefresh, 
  MdSearch, 
  MdAdd, 
  MdEdit, 
  MdDelete,
  MdImage,
  MdSave,
  MdCancel,
  MdCheckCircle,
  MdErrorOutline,
  MdWarning,
  MdCloudUpload,
  MdClose
} from "react-icons/md";

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({ total: 0, active: 0, withImages: 0 });
  const [error, setError] = useState(null);
  
  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    imageUrl: "",
    isActive: true,
    sortOrder: 0
  });
  
  // Image upload states
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const categoriesRef = collection(db, "categories");
      const snapshot = await getDocs(categoriesRef);
      
      const data = snapshot.docs.map(doc => { 
        const docData = doc.data();
        
        return {
          id: doc.id, 
          ...docData,
          createdAt: docData.createdAt?.toDate ? docData.createdAt.toDate() : docData.createdAt || new Date(),
          updatedAt: docData.updatedAt?.toDate ? docData.updatedAt.toDate() : docData.updatedAt || null
        };
      });
      
      setCategories(data);
      setFilteredCategories(data);
      
      // Calculate stats
      const activeCount = data.filter(cat => cat.isActive !== false).length;
      const imageCount = data.filter(cat => cat.imageUrl).length;
      
      setStats({
        total: data.length,
        active: activeCount,
        withImages: imageCount
      });
      
    } catch (err) {
      console.error("Error fetching categories:", err);
      setError(`Failed to fetch categories: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCategories(categories);
      return;
    }

    const searchLower = searchTerm.toLowerCase();
    const filtered = categories.filter(cat => 
      (cat.name && cat.name.toLowerCase().includes(searchLower)) ||
      (cat.description && cat.description.toLowerCase().includes(searchLower)) ||
      (cat.id && cat.id.toLowerCase().includes(searchLower))
    );
    setFilteredCategories(filtered);
  }, [searchTerm, categories]);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Please select a valid image file (JPEG, PNG, GIF, WebP)');
      return;
    }
    
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }
    
    setImageFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const uploadImageToStorage = async (file) => {
    if (!file) return null;
    
    try {
      setUploadingImage(true);
      
      // Create unique filename
      const timestamp = Date.now();
      const fileName = `category_${timestamp}_${file.name.replace(/\s+/g, '_')}`;
      
      // Create storage reference
      const storageRef = ref(storage, `categories/${fileName}`);
      
      // Upload file
      const snapshot = await uploadBytes(storageRef, file);
      
      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      console.log('Image uploaded successfully:', downloadURL);
      return downloadURL;
      
    } catch (err) {
      console.error('Error uploading image:', err);
      throw new Error(`Failed to upload image: ${err.message}`);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    try {
      let imageUrl = formData.imageUrl;
      
      // If a new image file is selected, upload it
      if (imageFile) {
        const uploadedUrl = await uploadImageToStorage(imageFile);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }
      
      const newCategory = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        imageUrl,
        isActive: formData.isActive,
        sortOrder: parseInt(formData.sortOrder) || 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      console.log("Adding new category:", newCategory);
      await addDoc(collection(db, "categories"), newCategory);
      alert("Category added successfully!");
      resetForm();
      setShowAddForm(false);
      fetchCategories();
    } catch (err) {
      console.error("Error adding category:", err);
      alert(`Failed to add category: ${err.message}`);
    }
  };

  const handleEditCategory = async (e) => {
    e.preventDefault();
    try {
      // Check if document exists before updating
      const categoriesRef = collection(db, "categories");
      const snapshot = await getDocs(categoriesRef);
      const categoryExists = snapshot.docs.some(doc => doc.id === editingId);
      
      if (!categoryExists) {
        throw new Error(`Category with ID "${editingId}" does not exist. It may have been deleted.`);
      }
      
      let imageUrl = formData.imageUrl;
      
      // If a new image file is selected, upload it
      if (imageFile) {
        const uploadedUrl = await uploadImageToStorage(imageFile);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }
      
      const categoryRef = doc(db, "categories", editingId);
      const updatedData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        imageUrl,
        isActive: formData.isActive,
        sortOrder: parseInt(formData.sortOrder) || 0,
        updatedAt: serverTimestamp()
      };
      
      console.log("Updating category:", editingId, updatedData);
      await updateDoc(categoryRef, updatedData);
      alert("Category updated successfully!");
      resetForm();
      setEditingId(null);
      fetchCategories();
    } catch (err) {
      console.error("Error updating category:", err);
      alert(`Failed to update category: ${err.message}`);
    }
  };

  const handleDeleteCategory = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete category "${name}"?`)) {
      return;
    }
    
    try {
      // Check if document exists before deleting
      const categoriesRef = collection(db, "categories");
      const snapshot = await getDocs(categoriesRef);
      const categoryExists = snapshot.docs.some(doc => doc.id === id);
      
      if (!categoryExists) {
        alert(`Category "${name}" no longer exists. It may have been deleted by another user.`);
        fetchCategories(); // Refresh to get current data
        return;
      }
      
      console.log("Deleting category:", id);
      await deleteDoc(doc(db, "categories", id));
      alert("Category deleted successfully!");
      fetchCategories();
    } catch (err) {
      console.error("Error deleting category:", err);
      alert(`Failed to delete category: ${err.message}`);
    }
  };

  const startEditing = (category) => {
    console.log("Starting to edit category:", category);
    setEditingId(category.id);
    setFormData({
      name: category.name || "",
      description: category.description || "",
      imageUrl: category.imageUrl || "",
      isActive: category.isActive !== false,
      sortOrder: category.sortOrder || 0
    });
    
    // Reset image upload states
    setImageFile(null);
    setImagePreview(category.imageUrl || null);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      imageUrl: "",
      isActive: true,
      sortOrder: 0
    });
    setImageFile(null);
    setImagePreview(null);
    setEditingId(null);
    setUploadingImage(false);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData(prev => ({ ...prev, imageUrl: "" }));
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (err) {
      return "Invalid Date";
    }
  };

  return (
    <div style={{ padding: "0 10px" }}>
      {/* Header Section */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        marginBottom: 30,
        padding: "20px 0"
      }}>
        <div>
          <h1 style={{ 
            margin: 0, 
            fontSize: "28px", 
            fontWeight: "600", 
            color: "#2D3748",
            display: "flex",
            alignItems: "center",
            gap: "12px"
          }}>
            <MdCategory style={{ color: "#01615F" }} />
            Categories Management
          </h1>
          <p style={{ 
            margin: "8px 0 0", 
            color: "#718096", 
            fontSize: "14px" 
          }}>
            Organize products with categories
          </p>
        </div>
        
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <button
            onClick={() => {
              resetForm();
              setShowAddForm(true);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 20px",
              backgroundColor: "#01615F",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontWeight: "600",
              cursor: "pointer",
              fontSize: "14px",
              transition: "all 0.2s ease"
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = "#028C89"}
            onMouseOut={(e) => e.target.style.backgroundColor = "#01615F"}
          >
            <MdAdd />
            Add Category
          </button>
          
          <button
            onClick={fetchCategories}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 20px",
              backgroundColor: "transparent",
              border: "1px solid #E2E8F0",
              color: "#4A5568",
              borderRadius: "8px",
              fontWeight: "500",
              cursor: "pointer",
              fontSize: "14px",
              transition: "all 0.2s ease"
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = "#F7FAFC"}
            onMouseOut={(e) => e.target.style.backgroundColor = "transparent"}
          >
            <MdRefresh />
            Refresh
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div style={{
          backgroundColor: "#FEF2F2",
          border: "1px solid #FECACA",
          borderRadius: "8px",
          padding: "15px",
          marginBottom: "20px",
          display: "flex",
          alignItems: "flex-start",
          gap: "12px"
        }}>
          <MdErrorOutline style={{ color: "#DC2626", flexShrink: 0, marginTop: "2px" }} />
          <div>
            <strong style={{ color: "#DC2626" }}>Error:</strong>
            <p style={{ margin: "4px 0 0", color: "#7F1D1D" }}>{error}</p>
            <button 
              onClick={fetchCategories}
              style={{
                marginTop: "8px",
                padding: "6px 12px",
                backgroundColor: "#DC2626",
                color: "white",
                border: "none",
                borderRadius: "4px",
                fontSize: "12px",
                cursor: "pointer"
              }}
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
        gap: "20px", 
        marginBottom: 30 
      }}>
        <div style={{ 
          backgroundColor: "white", 
          padding: "20px", 
          borderRadius: "12px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
          borderLeft: "4px solid #01615F"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              backgroundColor: "#E6FFFA",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#01615F"
            }}>
              <MdCategory size={20} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: "12px", color: "#718096", fontWeight: "600" }}>Total Categories</p>
              <p style={{ margin: "4px 0 0", fontSize: "24px", fontWeight: "700", color: "#2D3748" }}>
                {stats.total}
              </p>
            </div>
          </div>
        </div>

        <div style={{ 
          backgroundColor: "white", 
          padding: "20px", 
          borderRadius: "12px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
          borderLeft: "4px solid #48BB78"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              backgroundColor: "#F0FFF4",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#48BB78"
            }}>
              <MdCheckCircle size={20} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: "12px", color: "#718096", fontWeight: "600" }}>Active Categories</p>
              <p style={{ margin: "4px 0 0", fontSize: "24px", fontWeight: "700", color: "#2D3748" }}>
                {stats.active}
              </p>
            </div>
          </div>
        </div>

        <div style={{ 
          backgroundColor: "white", 
          padding: "20px", 
          borderRadius: "12px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
          borderLeft: "4px solid #9F7AEA"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              backgroundColor: "#FAF5FF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#9F7AEA"
            }}>
              <MdImage size={20} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: "12px", color: "#718096", fontWeight: "600" }}>With Images</p>
              <p style={{ margin: "4px 0 0", fontSize: "24px", fontWeight: "700", color: "#2D3748" }}>
                {stats.withImages}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Form */}
      {(showAddForm || editingId) && (
        <div style={{ 
          backgroundColor: "white", 
          padding: "30px", 
          borderRadius: "12px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          marginBottom: 30
        }}>
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center",
            marginBottom: 25
          }}>
            <h3 style={{ margin: 0, color: "#2D3748" }}>
              {editingId ? "Edit Category" : "Add New Category"}
            </h3>
            <button
              onClick={() => {
                resetForm();
                setShowAddForm(false);
              }}
              style={{
                background: "none",
                border: "none",
                color: "#718096",
                cursor: "pointer",
                fontSize: "20px",
                padding: "5px"
              }}
            >
              <MdCancel />
            </button>
          </div>
          
          <form onSubmit={editingId ? handleEditCategory : handleAddCategory}>
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", 
              gap: "20px",
              marginBottom: "25px"
            }}>
              <div>
                <label style={{ 
                  display: "block", 
                  marginBottom: "8px", 
                  fontSize: "14px", 
                  fontWeight: "600",
                  color: "#4A5568"
                }}>
                  Category Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  required
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    border: "1px solid #E2E8F0",
                    borderRadius: "8px",
                    fontSize: "14px",
                    backgroundColor: "#F7FAFC",
                    transition: "all 0.2s ease"
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#01615F";
                    e.target.style.backgroundColor = "white";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#E2E8F0";
                    e.target.style.backgroundColor = "#F7FAFC";
                  }}
                  placeholder="Enter category name"
                />
              </div>
              
              <div>
                <label style={{ 
                  display: "block", 
                  marginBottom: "8px", 
                  fontSize: "14px", 
                  fontWeight: "600",
                  color: "#4A5568"
                }}>
                  Sort Order
                </label>
                <input
                  type="number"
                  name="sortOrder"
                  value={formData.sortOrder}
                  onChange={handleFormChange}
                  min="0"
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    border: "1px solid #E2E8F0",
                    borderRadius: "8px",
                    fontSize: "14px",
                    backgroundColor: "#F7FAFC"
                  }}
                  placeholder="Display order"
                />
              </div>
              
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ 
                  display: "block", 
                  marginBottom: "8px", 
                  fontSize: "14px", 
                  fontWeight: "600",
                  color: "#4A5568"
                }}>
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  rows="3"
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    border: "1px solid #E2E8F0",
                    borderRadius: "8px",
                    fontSize: "14px",
                    backgroundColor: "#F7FAFC",
                    resize: "vertical",
                    minHeight: "100px"
                  }}
                  placeholder="Enter category description"
                />
              </div>
              
              {/* Image Upload Section */}
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ 
                  display: "block", 
                  marginBottom: "8px", 
                  fontSize: "14px", 
                  fontWeight: "600",
                  color: "#4A5568"
                }}>
                  Category Image
                </label>
                
                <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
                  {/* Image Preview */}
                  {(imagePreview || formData.imageUrl) && (
                    <div style={{
                      width: "120px",
                      height: "120px",
                      borderRadius: "8px",
                      overflow: "hidden",
                      border: "1px solid #E2E8F0",
                      position: "relative"
                    }}>
                      <img 
                        src={imagePreview || formData.imageUrl} 
                        alt="Preview" 
                        style={{ 
                          width: "100%", 
                          height: "100%", 
                          objectFit: "cover" 
                        }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          const parent = e.target.parentElement;
                          parent.innerHTML = `
                            <div style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; background: #F7FAFC; color: #718096;">
                              <MdImage size={32} />
                            </div>
                          `;
                        }}
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        style={{
                          position: "absolute",
                          top: "5px",
                          right: "5px",
                          background: "rgba(0, 0, 0, 0.7)",
                          color: "white",
                          border: "none",
                          borderRadius: "50%",
                          width: "24px",
                          height: "24px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          fontSize: "12px"
                        }}
                      >
                        <MdClose />
                      </button>
                    </div>
                  )}
                  
                  {/* Upload Area */}
                  <div style={{ flex: 1 }}>
                    <div style={{
                      border: "2px dashed #CBD5E0",
                      borderRadius: "8px",
                      padding: "20px",
                      textAlign: "center",
                      backgroundColor: "#F7FAFC",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      position: "relative"
                    }}
                    onMouseOver={(e) => e.currentTarget.style.borderColor = "#01615F"}
                    onMouseOut={(e) => e.currentTarget.style.borderColor = "#CBD5E0"}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: "100%",
                          opacity: 0,
                          cursor: "pointer"
                        }}
                      />
                      <div style={{ color: "#718096" }}>
                        <MdCloudUpload size={32} style={{ marginBottom: "10px" }} />
                        <p style={{ margin: "0 0 8px", fontWeight: "500" }}>
                          Click to upload image or drag and drop
                        </p>
                        <p style={{ margin: 0, fontSize: "12px", color: "#A0AEC0" }}>
                          PNG, JPG, GIF, WebP up to 5MB
                        </p>
                        {imageFile && (
                          <p style={{ margin: "10px 0 0", fontSize: "12px", color: "#48BB78" }}>
                            Selected: {imageFile.name}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Or use URL input */}
                    <div style={{ marginTop: "15px" }}>
                      <p style={{ margin: "0 0 8px", fontSize: "12px", color: "#718096" }}>
                        Or enter image URL:
                      </p>
                      <input
                        type="url"
                        name="imageUrl"
                        value={formData.imageUrl}
                        onChange={handleFormChange}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          border: "1px solid #E2E8F0",
                          borderRadius: "6px",
                          fontSize: "13px",
                          backgroundColor: "white"
                        }}
                        placeholder="https://example.com/image.jpg"
                        disabled={!!imageFile}
                      />
                    </div>
                  </div>
                </div>
                
                {uploadingImage && (
                  <div style={{ 
                    marginTop: "10px", 
                    padding: "8px",
                    backgroundColor: "#EDF2F7",
                    borderRadius: "4px",
                    fontSize: "13px",
                    color: "#4A5568",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}>
                    <div style={{
                      width: "16px",
                      height: "16px",
                      border: "2px solid #E2E8F0",
                      borderTopColor: "#01615F",
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite"
                    }} />
                    Uploading image...
                  </div>
                )}
              </div>
              
              <div>
                <label style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "10px",
                  fontSize: "14px", 
                  fontWeight: "600",
                  color: "#4A5568",
                  cursor: "pointer"
                }}>
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleFormChange}
                    style={{ width: "18px", height: "18px" }}
                  />
                  Active Category
                </label>
                <p style={{ margin: "8px 0 0", fontSize: "13px", color: "#718096" }}>
                  Inactive categories won't be shown to users
                </p>
              </div>
            </div>
            
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setShowAddForm(false);
                }}
                style={{
                  padding: "12px 24px",
                  backgroundColor: "transparent",
                  border: "1px solid #E2E8F0",
                  color: "#4A5568",
                  borderRadius: "8px",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontSize: "14px"
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploadingImage}
                style={{
                  padding: "12px 24px",
                  backgroundColor: uploadingImage ? "#CBD5E0" : "#01615F",
                  border: "none",
                  color: "white",
                  borderRadius: "8px",
                  fontWeight: "600",
                  cursor: uploadingImage ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  opacity: uploadingImage ? 0.7 : 1
                }}
              >
                {uploadingImage ? (
                  <>
                    <div style={{
                      width: "16px",
                      height: "16px",
                      border: "2px solid rgba(255,255,255,0.3)",
                      borderTopColor: "white",
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite"
                    }} />
                    Uploading...
                  </>
                ) : (
                  <>
                    <MdSave />
                    {editingId ? "Update Category" : "Add Category"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search and Filter Section */}
      <div style={{ 
        backgroundColor: "white", 
        padding: "20px", 
        borderRadius: "12px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
        marginBottom: 20
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <MdSearch style={{ 
              position: "absolute", 
              left: "15px", 
              top: "50%", 
              transform: "translateY(-50%)", 
              color: "#A0AEC0" 
            }} />
            <input
              type="text"
              placeholder="Search categories by name, description, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 20px 12px 45px",
                border: "1px solid #E2E8F0",
                borderRadius: "8px",
                fontSize: "14px",
                backgroundColor: "#F7FAFC",
                transition: "all 0.2s ease"
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#01615F";
                e.target.style.backgroundColor = "white";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#E2E8F0";
                e.target.style.backgroundColor = "#F7FAFC";
              }}
            />
          </div>
          <div style={{ 
            padding: "8px 16px", 
            backgroundColor: "#EDF2F7", 
            borderRadius: "6px", 
            fontSize: "14px",
            color: "#4A5568",
            fontWeight: "500"
          }}>
            Showing {filteredCategories.length} of {categories.length}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && !error && (
        <div style={{ 
          backgroundColor: "white", 
          borderRadius: "12px",
          padding: "60px",
          textAlign: "center",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)"
        }}>
          <div style={{
            width: "50px",
            height: "50px",
            border: "4px solid #E2E8F0",
            borderTopColor: "#01615F",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto 20px"
          }} />
          <p style={{ color: "#718096", fontWeight: "500" }}>Loading categories...</p>
        </div>
      )}

      {/* Error or Empty State */}
      {!loading && error && (
        <div style={{ 
          backgroundColor: "white", 
          borderRadius: "12px",
          padding: "60px",
          textAlign: "center",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)"
        }}>
          <div style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            backgroundColor: "#FEF2F2",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
            color: "#DC2626"
          }}>
            <MdErrorOutline size={40} />
          </div>
          <h3 style={{ margin: "0 0 10px", color: "#2D3748" }}>Failed to Load Categories</h3>
          <p style={{ color: "#718096", marginBottom: "20px" }}>
            {error}
          </p>
          <button
            onClick={fetchCategories}
            style={{
              padding: "10px 24px",
              backgroundColor: "#DC2626",
              border: "none",
              color: "white",
              borderRadius: "8px",
              fontWeight: "600",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <MdRefresh />
            Retry Loading
          </button>
        </div>
      )}

      {/* No Data State */}
      {!loading && !error && filteredCategories.length === 0 && categories.length === 0 && (
        <div style={{ 
          backgroundColor: "white", 
          borderRadius: "12px",
          padding: "60px",
          textAlign: "center",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)"
        }}>
          <div style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            backgroundColor: "#F7FAFC",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
            color: "#A0AEC0"
          }}>
            <MdCategory size={40} />
          </div>
          <h3 style={{ margin: "0 0 10px", color: "#2D3748" }}>
            {searchTerm ? "No matching categories found" : "No categories found"}
          </h3>
          <p style={{ color: "#718096", marginBottom: "20px" }}>
            {searchTerm ? "Try a different search term" : "Start by adding your first category"}
          </p>
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              style={{
                padding: "10px 24px",
                backgroundColor: "#01615F",
                border: "none",
                color: "white",
                borderRadius: "8px",
                fontWeight: "600",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              <MdAdd />
              Add First Category
            </button>
          )}
        </div>
      )}

      {/* Categories Grid - Only show when there's data */}
      {!loading && !error && filteredCategories.length > 0 && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "20px",
          marginBottom: "30px"
        }}>
          {filteredCategories.map(category => (
            <div 
              key={category.id}
              style={{
                backgroundColor: "white",
                borderRadius: "12px",
                overflow: "hidden",
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                border: category.isActive === false ? "1px solid #FED7D7" : "1px solid #E2E8F0",
                transition: "transform 0.2s ease, box-shadow 0.2s ease"
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 8px 30px rgba(0,0,0,0.12)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.08)";
              }}
            >
              {/* Image Section */}
              <div style={{
                height: "180px",
                backgroundColor: "#F7FAFC",
                position: "relative",
                overflow: "hidden"
              }}>
                {category.imageUrl ? (
                  <img 
                    src={category.imageUrl} 
                    alt={category.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover"
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      const parent = e.target.parentElement;
                      parent.innerHTML = `
                        <div style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; background: #F7FAFC; color: #CBD5E0;">
                          <MdImage size={48} />
                        </div>
                      `;
                    }}
                  />
                ) : (
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    height: "100%",
                    color: "#CBD5E0"
                  }}>
                    <MdImage size={48} />
                  </div>
                )}
                
                {/* Status Badge */}
                <div style={{
                  position: "absolute",
                  top: "12px",
                  left: "12px",
                  padding: "6px 12px",
                  backgroundColor: category.isActive === false ? "#FED7D7" : "#C6F6D5",
                  color: category.isActive === false ? "#9B2C2C" : "#22543D",
                  fontSize: "12px",
                  fontWeight: "600",
                  borderRadius: "20px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}>
                  {category.isActive === false ? <MdErrorOutline /> : <MdCheckCircle />}
                  {category.isActive === false ? "Inactive" : "Active"}
                </div>
              </div>
              
              {/* Content Section */}
              <div style={{ padding: "20px" }}>
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "flex-start",
                  marginBottom: "12px"
                }}>
                  <h3 style={{ 
                    margin: 0, 
                    fontSize: "18px", 
                    fontWeight: "600", 
                    color: "#2D3748",
                    flex: 1
                  }}>
                    {category.name}
                  </h3>
                  
                  <div style={{ 
                    display: "flex", 
                    gap: "8px",
                    marginLeft: "10px"
                  }}>
                    <button
                      onClick={() => startEditing(category)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#01615F",
                        cursor: "pointer",
                        fontSize: "18px",
                        padding: "4px",
                        borderRadius: "4px",
                        transition: "background-color 0.2s ease"
                      }}
                      onMouseOver={(e) => e.target.style.backgroundColor = "#E6FFFA"}
                      onMouseOut={(e) => e.target.style.backgroundColor = "transparent"}
                      title="Edit"
                    >
                      <MdEdit />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category.id, category.name)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#F56565",
                        cursor: "pointer",
                        fontSize: "18px",
                        padding: "4px",
                        borderRadius: "4px",
                        transition: "background-color 0.2s ease"
                      }}
                      onMouseOver={(e) => e.target.style.backgroundColor = "#FFF5F5"}
                      onMouseOut={(e) => e.target.style.backgroundColor = "transparent"}
                      title="Delete"
                    >
                      <MdDelete />
                    </button>
                  </div>
                </div>
                
                {category.description && (
                  <p style={{ 
                    margin: "0 0 15px", 
                    fontSize: "14px", 
                    color: "#718096",
                    lineHeight: "1.5"
                  }}>
                    {category.description.length > 100 
                      ? `${category.description.substring(0, 100)}...` 
                      : category.description}
                  </p>
                )}
                
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center",
                  paddingTop: "15px",
                  borderTop: "1px solid #EDF2F7",
                  fontSize: "13px",
                  color: "#A0AEC0"
                }}>
                  <div>
                    Sort: <strong style={{ color: "#4A5568" }}>{category.sortOrder || 0}</strong>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    Created: <strong style={{ color: "#4A5568" }}>{formatDate(category.createdAt)}</strong>
                  </div>
                </div>
                
                <div style={{ 
                  marginTop: "15px",
                  padding: "8px 12px",
                  backgroundColor: "#F7FAFC",
                  borderRadius: "6px",
                  fontSize: "12px",
                  color: "#718096",
                  display: "flex",
                  justifyContent: "space-between"
                }}>
                  <span>ID: {category.id?.substring(0, 8) || "N/A"}...</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(category.id);
                      alert("Category ID copied to clipboard!");
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#01615F",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: "600"
                    }}
                  >
                    Copy ID
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add CSS for spinner animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}