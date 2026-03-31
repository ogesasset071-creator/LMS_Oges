import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import "./EducatorDashboard.css";
import "./Player.css";
import api from "../services/api";
import Cropper from "react-easy-crop";
import { getCroppedImgFile } from "../utils/canvasUtils";
import {
  FiSearch,
  FiBook,
  FiLayers,
  FiPlus,
  FiEdit3,
  FiTrash2,
  FiClock,
  FiAward,
  FiCheckCircle,
  FiPlay,
  FiChevronRight,
  FiLock,
} from "react-icons/fi";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const AdminDashboard = ({ onLogout, isDarkMode, onToggleTheme }) => {
  const { tab: tabParam, courseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [currentTab, setCurrentTab] = useState(tabParam || "Dashboard");
  const [units, setUnits] = useState([
    {
      title: "",
      chapters: [{ title: "", videoUrl: "", duration: "", resources: [] }],
    },
  ]);
  const [courseData, setCourseData] = useState({
    title: "",
    description: "",
    category: "Programming",
    level: "Beginner",
    language: "English",
    thumbnail: "",
    price: 0,
    full_name: "",
    bio: "",
    avatar: "",
    id: null,
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [myCourses, setMyCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [selectedCourseCategory, setSelectedCourseCategory] = useState("All");
  const [selectedCourseLevel, setSelectedCourseLevel] = useState("All");
  const [selectedPreviewCourse, setSelectedPreviewCourse] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeVideoUrl, setActiveVideoUrl] = useState(null);
  const [myAssignments, setMyAssignments] = useState([]);
  const [selectedPreviewAssignment, setSelectedPreviewAssignment] =
    useState(null);
  const [detailTab, setDetailTab] = useState("Curriculum");
  const [announcements, setAnnouncements] = useState([]);
  const [announcementText, setAnnouncementText] = useState("");
  const [isPostingAnnouncement, setIsPostingAnnouncement] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [completions, setCompletions] = useState([]);
  const [adminStats, setAdminStats] = useState(null);
  const [isUploadingThumb, setIsUploadingThumb] = useState(false);

  // Cropper State
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const courseLevels = ["All", "Beginner", "Intermediate", "Advanced"];

  const courseCategories = [
    "All",
    "Frontend Development",
    "Backend Development",
    "Full Stack",
    "QA & Testing",
    "Data Science",
    "Mobile Development",
    "UI/UX Design",
    "Cloud & DevOps",
    "Cyber Security",
  ];

  // Synchronize Tab State with Params
  useEffect(() => {
    if (tabParam) {
      setCurrentTab(tabParam);
    } else if (courseId) {
      if (location.pathname.includes("/edit/")) {
        setCurrentTab("Upload Training");
      } else {
        setCurrentTab("Training Details");
      }
    } else {
      setCurrentTab("Dashboard");
    }
  }, [tabParam, courseId, location.pathname]);

  // Handle direct edit routes or tab switches
  const fetchCourseDetails = async () => {
    if (!courseId) return;
    const existing = myCourses.find((c) => String(c.id) === String(courseId));
    const mapCourseToUnits = (course) => {
      if (course.units && course.units.length > 0) {
        return course.units.map((u) => ({
          title: u.title,
          chapters: (u.chapters || []).map((ch) => ({
            title: ch.title,
            videoUrl: ch.video_url || ch.videoUrl || "",
            duration: ch.duration || "",
            description: ch.description || "",
            content_type: ch.content_type || "Video",
            resources: ch.resources || [],
            sections: ch.sections || [],
          })),
        }));
      }
      const chapters = (course.chapters || []).map((ch) => ({
        title: ch.title,
        videoUrl: ch.video_url || ch.videoUrl || "",
        duration: ch.duration || "",
        pp_reward: ch.pp_reward || 50,
        resources: ch.resources || [],
      }));
      return chapters.length > 0
        ? [{ title: course.title || "Unit 1", chapters }]
        : [
          {
            title: "",
            chapters: [{ title: "", videoUrl: "", duration: "" }],
          },
        ];
    };

    if (existing) {
      setCourseData({
        ...courseData,
        title: existing.title || "",
        description: existing.description || "",
        category: existing.category || "Programming",
        level: existing.level || "Beginner",
        thumbnail: existing.thumbnail || "",
        tutor_name: existing.tutor_name || "",
      });
      setUnits(mapCourseToUnits(existing));
    } else {
      try {
        const res = await api.get(`/courses/${courseId}`);
        const found = res.data;
        if (found) {
          setCourseData({
            ...courseData,
            title: found.title || "",
            description: found.description || "",
            category: found.category || "Programming",
            level: found.level || "Beginner",
            thumbnail: found.thumbnail || "",
            tutor_name: found.tutor_name || "Oges Expert",
          });
          setUnits(mapCourseToUnits(found));
        }
      } catch (err) {
        console.error("Course fetch failed", err);
      }
    }
  };

  useEffect(() => {
    if (courseId) {
      fetchCourseDetails();
    } else if (tabParam === "Upload Training") {
      if (courseData.id) {
        setCourseData({
          title: "",
          description: "",
          category: "Programming",
          level: "Beginner",
          language: "English",
          thumbnail: "",
          price: 0,
          id: null,
        });
        setUnits([
          {
            title: "",
            chapters: [
              {
                title: "",
                videoUrl: "",
                duration: "",
                description: "",
                content_type: "Video",
                sections: [{ heading: "", description: "" }],
              },
            ],
          },
        ]);
      }
    }
  }, [courseId, tabParam]);

  // Assignment Builder State
  const [assignmentData, setAssignmentData] = useState({
    id: null,
    courseId: "",
    title: "",
    description: "",
    role: "learner",
  });
  const [assignmentQuestions, setAssignmentQuestions] = useState([
    {
      question: "",
      options: ["", ""],
      correct_options: "0",
      question_type: "mcq",
      correct_answer_text: "",
    },
  ]);

  const fetchAssignments = async () => {
    try {
      const res = await api.get("/user/educator/assignments");
      setMyAssignments(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAdminStats = async () => {
    try {
      const res = await api.get("/admin/dashboard/stats");
      setAdminStats(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteAssignment = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this assignment? All submissions for this assignment will also be removed.",
      )
    )
      return;
    try {
      await api.delete(`/admin/assignments/${id}`);
      fetchAssignments();
    } catch (err) {
      console.error(err);
      alert("Failed to delete assignment.");
    }
  };

  const handleEditAssignment = (assignment) => {
    // Navigate to assignment builder tab with existing data
    setAssignmentData({
      id: assignment.id,
      courseId: assignment.course_id || assignment.courseId || "",
      title: assignment.title,
      description: assignment.description,
      role: assignment.role || "learner",
    });
    setAssignmentQuestions(
      assignment.questions.map((q) => ({
        question: q.question_text,
        options: (q.options || "").split(","),
        correct_options: q.correct_options || "0",
        question_type: q.question_type || "mcq",
        correct_answer_text: q.correct_answer_text || "",
      })),
    );
    setCurrentTab(assignment.type === "quiz" ? "Upload Quiz" : "Upload Assignment");
  };

  React.useEffect(() => {
    if (
      [
        "Dashboard",
        "All Trainings",
        "Upload Assignment",
        "Upload Quiz",
      ].includes(currentTab)
    ) {
      fetchMyCourses();
    }

    if (currentTab === "My Assignments") {
      fetchAssignments();
    }
    if (currentTab === "Dashboard") {
      fetchAdminStats();
    }
  }, [currentTab]);

  React.useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const res = await api.get("/admin/submissions");
        setSubmissions(res.data);
      } catch (e) {
        console.error("Submissions fail", e);
      }
    };
    const fetchCompletions = async () => {
      try {
        const res = await api.get("/admin/completions");
        setCompletions(res.data);
      } catch (e) {
        console.error("Completions fail", e);
      }
    };

    if (currentTab === "Submissions") {
      fetchSubmissions();
    }
    if (currentTab === "Graduates") {
      fetchCompletions();
    }
  }, [currentTab]);

  React.useEffect(() => {
    if (currentTab === "Training Details" && courseId) {
      fetchCourseDetails();
      fetchAnnouncements();
    }
  }, [currentTab, courseId]);

  const fetchAnnouncements = async () => {
    try {
      const res = await api.get(`/courses/${courseId}/announcements`);
      setAnnouncements(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handlePostAnnouncement = async () => {
    if (!announcementText.trim()) return;
    setIsPostingAnnouncement(true);
    try {
      await api.post(`/courses/${courseId}/announcements`, {
        content: announcementText,
      });
      setAnnouncementText("");
      fetchAnnouncements();
    } catch (e) {
      console.error(e);
      alert("Failed to post announcement.");
    } finally {
      setIsPostingAnnouncement(false);
    }
  };

  React.useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await api.get("/user/me");
        setCourseData((prev) => ({
          ...prev,
          full_name: res.data.full_name || res.data.username || "",
          bio: res.data.bio || "",
          avatar: res.data.avatar || "",
        }));
      } catch (err) {
        console.error("Profile load fail", err);
        const savedUser = localStorage.getItem("user");
        if (savedUser) {
          const u = JSON.parse(savedUser);
          setCourseData((prev) => ({
            ...prev,
            full_name: u.full_name || u.username || "",
            bio: u.bio || "",
            avatar: u.avatar || "",
          }));
        }
      }
    };
    loadProfile();
  }, []);

  const fetchMyCourses = async () => {
    setLoadingCourses(true);
    try {
      const res = await api.get("/admin/courses");
      setMyCourses(res.data);
    } catch (err) {
      console.error("Failed to fetch courses:", err);
    } finally {
      setLoadingCourses(false);
    }
  };

  // --- UNIT / CHAPTER HELPERS ---
  const addUnit = () => {
    setUnits([
      ...units,
      {
        title: "",
        chapters: [
          {
            title: "",
            videoUrl: "",
            duration: "",
            description: "",
            content_type: "Video",
            resources: [],
          },
        ],
      },
    ]);
  };

  const removeUnit = (unitIdx) => {
    setUnits(units.filter((_, i) => i !== unitIdx));
  };

  const addChapter = (unitIdx) => {
    const arr = [...units];
    arr[unitIdx].chapters.push({
      title: "",
      videoUrl: "",
      duration: "",
      description: "",
      content_type: "Video",
    });
    setUnits(arr);
  };

  const removeChapter = (unitIdx, chapIdx) => {
    const arr = [...units];
    arr[unitIdx].chapters = arr[unitIdx].chapters.filter(
      (_, i) => i !== chapIdx,
    );
    setUnits(arr);
  };

  const updateUnitTitle = (unitIdx, value) => {
    const arr = [...units];
    arr[unitIdx].title = value;
    setUnits(arr);
  };

  const updateChapter = (unitIdx, chapIdx, field, value) => {
    const arr = [...units];
    arr[unitIdx].chapters[chapIdx][field] = value;
    setUnits(arr);
  };

  const addChapterSection = (unitIdx, chapIdx) => {
    const arr = [...units];
    if (!arr[unitIdx].chapters[chapIdx].sections)
      arr[unitIdx].chapters[chapIdx].sections = [];
    arr[unitIdx].chapters[chapIdx].sections.push({
      heading: "",
      description: "",
    });
    setUnits(arr);
  };

  const removeChapterSection = (unitIdx, chapIdx, secIdx) => {
    const arr = [...units];
    arr[unitIdx].chapters[chapIdx].sections.splice(secIdx, 1);
    setUnits(arr);
  };

  const updateChapterSection = (unitIdx, chapIdx, secIdx, field, value) => {
    const arr = [...units];
    arr[unitIdx].chapters[chapIdx].sections[secIdx][field] = value;
    setUnits(arr);
  };

  const addChapterResource = (unitIdx, chapIdx) => {
    const arr = [...units];
    if (!arr[unitIdx].chapters[chapIdx].resources)
      arr[unitIdx].chapters[chapIdx].resources = [];
    arr[unitIdx].chapters[chapIdx].resources.push({
      title: "",
      file_type: "pdf",
      file_url: "",
    });
    setUnits(arr);
  };

  const removeChapterResource = (unitIdx, chapIdx, resIdx) => {
    const arr = [...units];
    arr[unitIdx].chapters[chapIdx].resources.splice(resIdx, 1);
    setUnits(arr);
  };

  const updateChapterResource = (unitIdx, chapIdx, resIdx, field, value) => {
    const arr = [...units];
    arr[unitIdx].chapters[chapIdx].resources[resIdx][field] = value;
    setUnits(arr);
  };

  const handleResourceUpload = async (unitIdx, chapIdx, resIdx, file) => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await api.post("/courses/upload_resource", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      updateChapterResource(unitIdx, chapIdx, resIdx, "file_url", res.data.url);
      // Auto-set title if empty
      const currentTitle =
        units[unitIdx].chapters[chapIdx].resources[resIdx].title;
      if (!currentTitle) {
        updateChapterResource(unitIdx, chapIdx, resIdx, "title", file.name);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to upload material. Please try again.");
    }
  };

  const handlePublish = async () => {
    setIsUploading(true);
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setUploadProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        submitCourse();
      }
    }, 200);
  };

  const handleThumbnailUpload = async (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setIsUploadingThumb(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await api.post("/courses/upload_thumbnail", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setCourseData({ ...courseData, thumbnail: res.data.url });
    } catch (e) {
      console.error(e);
      alert("Failed to upload thumbnail.");
    } finally {
      setIsUploadingThumb(false);
    }
  };

  const submitCourse = async () => {
    const payload = {
      title: courseData.title,
      description: courseData.description,
      category: courseData.category,
      level: courseData.level || "Beginner",
      price: Number(courseData.price),
      thumbnail:
        courseData.thumbnail ||
        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3",
      chapters: [],
      units: units
        .filter((u) => u.title)
        .map((u, ui) => ({
          title: u.title,
          order_num: ui + 1,
          chapters: u.chapters
            .filter((ch) => ch.title && ch.videoUrl)
            .map((ch, ci) => ({
              title: ch.title,
              video_url: ch.videoUrl,
              description: ch.description,
              content_type: ch.content_type || "Video",
              order_num: ci + 1,
              pp_reward: Number(ch.pp_reward) || 50,
              sections: (ch.sections || []).filter((s) => s.heading),
              resources: (ch.resources || []).filter(
                (r) => r.title && r.file_url,
              ),
            })),
        })),
    };
    try {
      if (!payload.title) {
        console.warn("Please provide a course title.");
        setIsUploading(false);
        return;
      }

      if (courseData.id) {
        await api.put(`/courses/${courseData.id}`, payload);
        alert("Course updated successfully!");
      } else {
        await api.post("/courses", payload);
        alert("Course published successfully!");
      }
      setIsUploading(false);
      setUploadProgress(0);
      setCourseData({
        title: "",
        description: "",
        price: 0,
        category: "Programming",
        id: null,
      });
      setUnits([
        { title: "", chapters: [{ title: "", videoUrl: "", duration: "" }] },
      ]);
      fetchMyCourses();
      navigate("/admin/All Trainings");
    } catch (err) {
      console.error(err);
      setIsUploading(false);
      alert("Failed to save course. Please try again.");
    }
  };

  const handleEditCourse = (course) => {
    navigate(`/admin/edit/${course.id}`);
  };

  const handleDeleteCourse = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this module? This action cannot be undone.",
      )
    )
      return;
    try {
      await api.delete(`/courses/${id}`);
      fetchMyCourses();
    } catch (err) {
      console.error(err);
      alert("Failed to delete the course.");
    }
  };

  const submitAssignment = async () => {
    // Determine category/level from the selected course to maintain consistency
    const selectedCourse = myCourses.find(
      (c) => String(c.id) === String(assignmentData.courseId),
    );

    const payload = {
      courseId: Number(assignmentData.courseId),
      title: assignmentData.title,
      description: assignmentData.description,
      type: currentTab === "Upload Quiz" ? "quiz" : "assignment",
      questions: assignmentQuestions,
      reward_badge: "Professional Badge", // Default reward
      category: selectedCourse?.category || "General",
      level: selectedCourse?.level || "Beginner",
      role: assignmentData.role || "learner",
    };

    try {
      if (assignmentData.id) {
        await api.put(`/admin/assignments/${assignmentData.id}`, payload);
        alert("Assignment Updated Successfully!");
      } else {
        await api.post("/admin/assignments", payload);
        alert("Assignment Uploaded Successfully!");
      }
      setIsUploading(false);
      setUploadProgress(0);
      setAssignmentData({ id: null, courseId: "", title: "", description: "", role: "learner" });
      setAssignmentQuestions([
        {
          question: "",
          options: ["", ""],
          correct_options: "0",
          question_type: "mcq",
          correct_answer_text: "",
        },
      ]);
      setCurrentTab("My Assignments"); // Change to showing assignments list
    } catch (err) {
      console.error("Assignment save failed:", err);
      setIsUploading(false);
      alert(
        "Failed to save assignment. Please check the backend connection.",
      );
    }
  };

  const handlePublishAssignment = async () => {
    if (!assignmentData.courseId || !assignmentData.title) {
      alert(
        "Please ensure a course is selected and the assignment has a title.",
      );
      return;
    }
    setIsUploading(true);
    let progress = 0;
    const interval = setInterval(() => {
      progress += 20;
      setUploadProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        submitAssignment();
      }
    }, 200);
  };

  const handleSaveProfile = async () => {
    setIsUploading(true);
    try {
      const res = await api.put("/user/profile", {
        full_name: courseData.full_name,
        bio: courseData.bio,
        avatar: courseData.avatar,
      });
      localStorage.setItem("user", JSON.stringify(res.data));
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const onCropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setImageSrc(reader.result);
        setShowCropper(true);
      });
      reader.readAsDataURL(file);
    }
  };

  const handleUploadAvatar = async () => {
    setUploadingAvatar(true);
    try {
      const croppedImageBlob = await getCroppedImgFile(
        imageSrc,
        croppedAreaPixels,
      );
      const formData = new FormData();
      formData.append("file", croppedImageBlob, "avatar.jpg");

      const res = await api.post("/user/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setCourseData((prev) => ({ ...prev, avatar: res.data.avatar }));

      const savedUser = localStorage.getItem("user");
      if (savedUser) {
        const u = JSON.parse(savedUser);
        localStorage.setItem(
          "user",
          JSON.stringify({ ...u, avatar: res.data.avatar }),
        );
      }

      setShowCropper(false);
      setImageSrc(null);
    } catch (e) {
      console.error("Error uploading avatar:", e);
      alert("Failed to upload image. Please try again.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const renderTabContent = () => {
    switch (currentTab) {
      case "Dashboard":
        return (
          <div className="edu-content-scroll">
            {/* KPI Overview Row */}
            <div className="stats-header-grid">
              <div className="stat-card-premium">
                <div
                  className="stat-icon-bg"
                  style={{
                    background: "rgba(251, 146, 60, 0.1)",
                    color: "#fb923c",
                  }}
                >
                  📚
                </div>
                <div className="stat-info">
                  <span className="stat-label">Internal Trainings</span>
                  <h2 className="stat-value">
                    {adminStats?.course_count || 0}
                  </h2>
                  <span className="stat-trend" style={{ color: "#10b981" }}>
                    Live Content
                  </span>
                </div>
              </div>

              <div className="stat-card-premium">
                <div
                  className="stat-icon-bg"
                  style={{
                    background: "rgba(16, 185, 129, 0.1)",
                    color: "#10b981",
                  }}
                >
                  🎓
                </div>
                <div className="stat-info">
                  <span className="stat-label">Active Students</span>
                  <h2 className="stat-value">
                    {adminStats?.student_count || 0}
                  </h2>
                  <span className="stat-trend">Enrolled learners</span>
                </div>
              </div>

              <div className="stat-card-premium">
                <div
                  className="stat-icon-bg"
                  style={{
                    background: "rgba(251, 146, 60, 0.1)",
                    color: "#fb923c",
                  }}
                >
                  📝
                </div>
                <div className="stat-info">
                  <span className="stat-label">Assessments</span>
                  <h2 className="stat-value">
                    {adminStats?.assign_count || 0}
                  </h2>
                  <span className="stat-trend">Quiz & Assignments</span>
                </div>
              </div>
            </div>

            {/* Analytics Grid Section */}
            <div
              className="analytics-overview"
              style={{
                display: "grid",
                gridTemplateColumns: "1.6fr 1fr",
                gap: "2rem",
                marginTop: "2rem",
              }}
            >
              <div className="chart-placeholder-card">
                <h2 className="section-title">
                  Training Completion Trends (7 Days)
                </h2>
                <div
                  style={{ marginTop: "2rem", height: "300px", minWidth: 0 }}
                >
                  {adminStats?.chart_data ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={adminStats.chart_data}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="var(--border-color)"
                        />
                        <XAxis
                          dataKey="name"
                          stroke="var(--text-sub)"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          stroke="var(--text-sub)"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "var(--card-bg)",
                            border: "1px solid var(--border-color)",
                            borderRadius: "8px",
                            color: "var(--text-main)",
                          }}
                          itemStyle={{ color: "#fb923c", fontWeight: "bold" }}
                          cursor={{ fill: "var(--border-color)", opacity: 0.4 }}
                        />
                        <Bar
                          dataKey="completions"
                          fill="#fb923c"
                          radius={[4, 4, 0, 0]}
                          barSize={40}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p style={{ color: "var(--text-sub)" }}>
                      Loading chart data...
                    </p>
                  )}
                </div>
              </div>

              <div className="chart-placeholder-card">
                <h2 className="section-title">Submissions Breakdown</h2>
                <div
                  style={{ marginTop: "2rem", height: "300px", minWidth: 0 }}
                >
                  {adminStats?.pie_data ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={adminStats.pie_data}
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {adminStats.pie_data.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={index === 0 ? "#10b981" : "#f59e0b"}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            background: "var(--bg-color)",
                            border: "1px solid var(--border-color)",
                            borderRadius: "8px",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p style={{ color: "var(--text-sub)" }}>
                      Loading chart data...
                    </p>
                  )}
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: "2rem",
                    marginTop: "1rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      fontSize: "0.9rem",
                      fontWeight: "bold",
                    }}
                  >
                    <div
                      style={{
                        width: "12px",
                        height: "12px",
                        borderRadius: "50%",
                        background: "#10b981",
                      }}
                    ></div>
                    Completed
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      fontSize: "0.9rem",
                      fontWeight: "bold",
                    }}
                  >
                    <div
                      style={{
                        width: "12px",
                        height: "12px",
                        borderRadius: "50%",
                        background: "#f59e0b",
                      }}
                    ></div>
                    Pending
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case "Upload Training":
        return (
          <div className="edu-content-scroll">
            <section className="edu-section">
              <h2 className="section-title">Step 1: Basic Course Info</h2>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Course Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Master React in 30 Days"
                    value={courseData.title || ""}
                    onChange={(e) =>
                      setCourseData({ ...courseData, title: e.target.value })
                    }
                  />
                </div>
                <div className="form-group full-width">
                  <label>Description</label>
                  <textarea
                    rows="4"
                    placeholder="Describe what learners will learn..."
                    value={courseData.description || ""}
                    onChange={(e) =>
                      setCourseData({
                        ...courseData,
                        description: e.target.value,
                      })
                    }
                  ></textarea>
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={courseData.category}
                    onChange={(e) =>
                      setCourseData({ ...courseData, category: e.target.value })
                    }
                  >
                    {courseCategories
                      .filter((cat) => cat !== "All")
                      .map((cat) => (
                        <option key={cat}>{cat}</option>
                      ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Level</label>
                  <select
                    value={courseData.level}
                    onChange={(e) =>
                      setCourseData({ ...courseData, level: e.target.value })
                    }
                  >
                    <option>Beginner</option>
                    <option>Intermediate</option>
                    <option>Advanced</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Language</label>
                  <select>
                    <option>Hinglish</option>
                    <option>Hindi</option>
                    <option>English</option>
                    <option>Tamil</option>
                    <option>Telugu</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Thumbnail Image (URL or Upload)</label>
                  <div
                    className="file-upload-box"
                    style={{
                      padding: "1rem",
                      display: "flex",
                      gap: "1rem",
                      alignItems: "center",
                    }}
                  >
                    <input
                      type="text"
                      placeholder="https://image-url.com"
                      style={{
                        flex: 1,
                        background: "transparent",
                        border: "1px solid var(--border-color)",
                        color: "white",
                        padding: "0.5rem",
                        borderRadius: "8px",
                      }}
                      value={courseData.thumbnail || ""}
                      onChange={(e) =>
                        setCourseData({
                          ...courseData,
                          thumbnail: e.target.value,
                        })
                      }
                    />
                    <div style={{ position: "relative", height: "40px" }}>
                      <button
                        className="btn-secondary"
                        style={{
                          height: "100%",
                          padding: "0 1rem",
                          borderRadius: "8px",
                          background: "rgba(59,130,246,0.1)",
                          color: "var(--primary-blue)",
                          border: "1px solid var(--primary-blue)",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          fontWeight: "600",
                          fontSize: "0.85rem",
                        }}
                      >
                        {isUploadingThumb ? (
                          "..."
                        ) : (
                          <>
                            <FiPlus /> Upload
                          </>
                        )}
                      </button>
                      <input
                        type="file"
                        accept="image/*"
                        style={{
                          position: "absolute",
                          inset: 0,
                          opacity: 0,
                          cursor: "pointer",
                          width: "100%",
                        }}
                        onChange={handleThumbnailUpload}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="edu-section">
              <div className="section-header-flex">
                <h2 className="section-title">
                  Step 2: Course Structure (Units & Chapters)
                </h2>
                <div className="course-stats-mini">
                  <span>{units.length} Units</span>
                  <span>
                    {units.reduce((acc, u) => acc + u.chapters.length, 0)} Total
                    Chapters
                  </span>
                </div>
              </div>

              <div className="lectures-list">
                {units.map((unit, uIdx) => (
                  <div
                    key={uIdx}
                    style={{
                      marginBottom: "2rem",
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "20px",
                      padding: "1.5rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "1rem",
                        marginBottom: "1.5rem",
                      }}
                    >
                      <div
                        style={{
                          width: "40px",
                          height: "40px",
                          background: "var(--primary-blue)",
                          color: "white",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: "10px",
                          fontWeight: "800",
                        }}
                      >
                        {uIdx + 1}
                      </div>
                      <input
                        type="text"
                        placeholder={`Unit ${uIdx + 1} Title (e.g. HTML, CSS, JavaScript)`}
                        className="lec-title-input"
                        style={{
                          flex: 1,
                          fontSize: "1.1rem",
                          fontWeight: "700",
                        }}
                        value={unit.title || ""}
                        onChange={(e) => updateUnitTitle(uIdx, e.target.value)}
                      />
                      {units.length > 1 && (
                        <button
                          className="del-btn"
                          onClick={() => removeUnit(uIdx)}
                          style={{ color: "var(--danger)", fontWeight: "700" }}
                        >
                          Remove Unit
                        </button>
                      )}
                    </div>

                    {/* Chapters inside this unit */}
                    <div
                      style={{
                        paddingLeft: "1rem",
                        borderLeft: "3px solid var(--primary-blue)",
                        marginLeft: "1rem",
                      }}
                    >
                      {unit.chapters.map((ch, cIdx) => (
                        <div
                          className="lecture-item-card"
                          key={cIdx}
                          style={{ marginBottom: "1rem" }}
                        >
                          <div
                            className="lec-drag"
                            style={{
                              fontSize: "0.8rem",
                              color: "var(--text-sub)",
                            }}
                          >
                            Ch {cIdx + 1}
                          </div>
                          <div className="lec-info" style={{ flex: 1 }}>
                            <input
                              type="text"
                              placeholder={`Chapter ${cIdx + 1} Title`}
                              className="lec-title-input"
                              style={{ width: "100%", marginBottom: "1rem" }}
                              value={ch.title || ""}
                              onChange={(e) =>
                                updateChapter(
                                  uIdx,
                                  cIdx,
                                  "title",
                                  e.target.value,
                                )
                              }
                            />
                            <div
                              className="lec-row"
                              style={{
                                display: "flex",
                                gap: "1rem",
                                alignItems: "center",
                              }}
                            >
                              <input
                                type="text"
                                placeholder="YouTube Video URL"
                                value={ch.videoUrl || ""}
                                style={{ flex: 1 }}
                                onChange={(e) =>
                                  updateChapter(
                                    uIdx,
                                    cIdx,
                                    "videoUrl",
                                    e.target.value,
                                  )
                                }
                              />
                              <select
                                value={ch.content_type || "Video"}
                                style={{
                                  width: "120px",
                                  padding: "0.8rem",
                                  borderRadius: "8px",
                                  border: "1px solid var(--border-color)",
                                  background: "var(--bg-color)",
                                  color: "var(--text-main)",
                                }}
                                onChange={(e) =>
                                  updateChapter(
                                    uIdx,
                                    cIdx,
                                    "content_type",
                                    e.target.value,
                                  )
                                }
                              >
                                <option>Video</option>
                                <option>Quiz</option>
                                <option>Article</option>
                                <option>Assignment</option>
                              </select>
                              <input
                                type="text"
                                placeholder="Duration (e.g. 10m)"
                                className="small-input"
                                value={ch.duration || ""}
                                onChange={(e) =>
                                  updateChapter(
                                    uIdx,
                                    cIdx,
                                    "duration",
                                    e.target.value,
                                  )
                                }
                                style={{
                                  width: "80px",
                                  padding: "0.8rem",
                                  borderRadius: "8px",
                                  border: "1px solid var(--border-color)",
                                  background: "var(--bg-color)",
                                  color: "var(--text-main)",
                                }}
                              />
                              <input
                                type="number"
                                placeholder="PP Reward"
                                title="Points awarded for complete watch"
                                className="small-input"
                                value={ch.pp_reward || 50}
                                onChange={(e) =>
                                  updateChapter(
                                    uIdx,
                                    cIdx,
                                    "pp_reward",
                                    e.target.value,
                                  )
                                }
                                style={{
                                  width: "80px",
                                  padding: "0.8rem",
                                  borderRadius: "8px",
                                  border: "1px solid var(--border-color)",
                                  background: "var(--bg-color)",
                                  color: "var(--text-main)",
                                }}
                              />
                              {unit.chapters.length > 1 && (
                                <button
                                  className="del-btn"
                                  onClick={() => removeChapter(uIdx, cIdx)}
                                >
                                  ✕
                                </button>
                              )}
                            </div>

                            <div
                              style={{
                                marginTop: "1.2rem",
                                padding: "1.2rem",
                                background: "rgba(0,0,0,0.02)",
                                borderRadius: "12px",
                                border: "1px solid var(--border-color)",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  marginBottom: "1rem",
                                }}
                              >
                                <h5
                                  style={{
                                    margin: 0,
                                    fontSize: "0.9rem",
                                    color: "var(--text-main)",
                                  }}
                                >
                                  Lesson Details (Headings & Content)
                                </h5>
                                <button
                                  onClick={() => addChapterSection(uIdx, cIdx)}
                                  style={{
                                    padding: "0.4rem 0.8rem",
                                    fontSize: "0.8rem",
                                    background: "var(--primary-blue)",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                  }}
                                >
                                  + Add Section
                                </button>
                              </div>
                              {(ch.sections || []).map((sec, sIdx) => (
                                <div
                                  key={sIdx}
                                  style={{
                                    marginBottom: "1rem",
                                    paddingBottom: "1rem",
                                    borderBottom:
                                      sIdx < ch.sections.length - 1
                                        ? "1px dashed var(--border-color)"
                                        : "none",
                                  }}
                                >
                                  <div
                                    style={{
                                      display: "flex",
                                      gap: "0.8rem",
                                      marginBottom: "0.5rem",
                                    }}
                                  >
                                    <input
                                      placeholder="Sub-Heading"
                                      value={sec.heading || ""}
                                      onChange={(e) =>
                                        updateChapterSection(
                                          uIdx,
                                          cIdx,
                                          sIdx,
                                          "heading",
                                          e.target.value,
                                        )
                                      }
                                      style={{
                                        flex: 1,
                                        padding: "0.6rem",
                                        background: "var(--bg-color)",
                                        border: "1px solid var(--border-color)",
                                        color: "var(--text-main)",
                                        borderRadius: "6px",
                                        fontSize: "0.85rem",
                                      }}
                                    />
                                    <button
                                      onClick={() =>
                                        removeChapterSection(uIdx, cIdx, sIdx)
                                      }
                                      style={{
                                        background: "transparent",
                                        border: "none",
                                        color: "#ef4444",
                                        cursor: "pointer",
                                      }}
                                    >
                                      ✕
                                    </button>
                                  </div>
                                  <textarea
                                    placeholder="Detailed Content..."
                                    value={sec.description || ""}
                                    onChange={(e) =>
                                      updateChapterSection(
                                        uIdx,
                                        cIdx,
                                        sIdx,
                                        "description",
                                        e.target.value,
                                      )
                                    }
                                    rows="2"
                                    style={{
                                      width: "100%",
                                      padding: "0.6rem",
                                      background: "var(--bg-color)",
                                      border: "1px solid var(--border-color)",
                                      color: "var(--text-main)",
                                      borderRadius: "6px",
                                      fontSize: "0.8rem",
                                    }}
                                  ></textarea>
                                </div>
                              ))}

                              <div
                                style={{
                                  marginTop: "2rem",
                                  paddingTop: "1.5rem",
                                  borderTop: "1px solid var(--border-color)",
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    marginBottom: "1rem",
                                  }}
                                >
                                  <h5
                                    style={{
                                      margin: 0,
                                      fontSize: "0.9rem",
                                      color: "var(--text-main)",
                                    }}
                                  >
                                    Resources (PDFs, Notes, etc.)
                                  </h5>
                                  <button
                                    onClick={() =>
                                      addChapterResource(uIdx, cIdx)
                                    }
                                    style={{
                                      padding: "0.4rem 0.8rem",
                                      fontSize: "0.8rem",
                                      background: "var(--primary-blue)",
                                      color: "white",
                                      border: "none",
                                      borderRadius: "6px",
                                      cursor: "pointer",
                                    }}
                                  >
                                    + Add Resource
                                  </button>
                                </div>
                                {(ch.resources || []).map((res, rIdx) => (
                                  <div
                                    key={rIdx}
                                    style={{
                                      marginBottom: "1rem",
                                      padding: "1.2rem",
                                      background: "rgba(255,255,255,0.01)",
                                      border: "1px solid var(--border-color)",
                                      borderRadius: "12px",
                                    }}
                                  >
                                    <div
                                      style={{
                                        display: "flex",
                                        gap: "0.8rem",
                                        marginBottom: "1rem",
                                        alignItems: "center",
                                      }}
                                    >
                                      <input
                                        placeholder="Resource Title (e.g. Chapter 1 PDF)"
                                        value={res.title || ""}
                                        onChange={(e) =>
                                          updateChapterResource(
                                            uIdx,
                                            cIdx,
                                            rIdx,
                                            "title",
                                            e.target.value,
                                          )
                                        }
                                        style={{
                                          flex: 1.5,
                                          padding: "0.6rem",
                                          background: "var(--bg-color)",
                                          border:
                                            "1px solid var(--border-color)",
                                          color: "var(--text-main)",
                                          borderRadius: "6px",
                                          fontSize: "0.85rem",
                                        }}
                                      />
                                      <select
                                        value={res.file_type || "pdf"}
                                        onChange={(e) =>
                                          updateChapterResource(
                                            uIdx,
                                            cIdx,
                                            rIdx,
                                            "file_type",
                                            e.target.value,
                                          )
                                        }
                                        style={{
                                          flex: 1,
                                          padding: "0.6rem",
                                          background: "var(--bg-color)",
                                          border:
                                            "1px solid var(--border-color)",
                                          color: "var(--text-main)",
                                          borderRadius: "6px",
                                          fontSize: "0.85rem",
                                        }}
                                      >
                                        <option value="pdf">
                                          PDF Document
                                        </option>
                                        <option value="link">Web Link</option>
                                        <option value="zip">
                                          Downloadable (ZIP)
                                        </option>
                                        <option value="doc">Document</option>
                                        <option value="other">Other</option>
                                      </select>
                                      <button
                                        onClick={() =>
                                          removeChapterResource(
                                            uIdx,
                                            cIdx,
                                            rIdx,
                                          )
                                        }
                                        style={{
                                          background: "transparent",
                                          border: "none",
                                          color: "#ef4444",
                                          cursor: "pointer",
                                        }}
                                      >
                                        ✕
                                      </button>
                                    </div>
                                    <div
                                      style={{
                                        display: "flex",
                                        gap: "0.8rem",
                                        alignItems: "center",
                                      }}
                                    >
                                      <input
                                        placeholder="File URL / Public Link (Uploaded automatically if you pick a file)"
                                        value={res.file_url || ""}
                                        onChange={(e) =>
                                          updateChapterResource(
                                            uIdx,
                                            cIdx,
                                            rIdx,
                                            "file_url",
                                            e.target.value,
                                          )
                                        }
                                        style={{
                                          flex: 1,
                                          padding: "0.6rem",
                                          background: "var(--bg-color)",
                                          border:
                                            "1px solid var(--border-color)",
                                          color: "var(--text-main)",
                                          borderRadius: "6px",
                                          fontSize: "0.85rem",
                                          opacity: res.file_url ? 0.7 : 1,
                                        }}
                                      />
                                      <div style={{ position: "relative" }}>
                                        <button
                                          style={{
                                            padding: "0.6rem 1.25rem",
                                            background: "var(--primary-blue)",
                                            color: "white",
                                            border: "none",
                                            borderRadius: "6px",
                                            fontSize: "0.8rem",
                                            cursor: "pointer",
                                            fontWeight: "800",
                                          }}
                                        >
                                          {res.file_url
                                            ? "Change File"
                                            : "Upload File"}
                                        </button>
                                        <input
                                          type="file"
                                          onChange={(e) =>
                                            e.target.files[0] &&
                                            handleResourceUpload(
                                              uIdx,
                                              cIdx,
                                              rIdx,
                                              e.target.files[0],
                                            )
                                          }
                                          style={{
                                            position: "absolute",
                                            inset: 0,
                                            opacity: 0,
                                            cursor: "pointer",
                                          }}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      <button
                        className="add-lec-btn"
                        onClick={() => addChapter(uIdx)}
                        style={{ fontSize: "0.9rem", padding: "0.5rem 1rem" }}
                      >
                        + Add Chapter
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  className="add-lec-btn"
                  onClick={addUnit}
                  style={{ marginTop: "1rem" }}
                >
                  + Add New Unit
                </button>
              </div>
            </section>
          </div>
        );
      case "All Trainings": {
        const filtered = myCourses.filter((c) => {
          const matchCat =
            selectedCourseCategory === "All" ||
            c.category === selectedCourseCategory;
          const matchLvl =
            selectedCourseLevel === "All" ||
            (c.level || "Beginner") === selectedCourseLevel;
          const matchSearch = c.title
            .toLowerCase()
            .includes(searchQuery.toLowerCase());
          return matchCat && matchLvl && matchSearch;
        });

        return (
          <div className="edu-content-scroll">
            <div className="filters-container">
              <div className="filter-group">
                <span className="filter-label">Categories</span>
                {courseCategories.map((cat) => (
                  <button
                    key={cat}
                    className={`premium-chip ${selectedCourseCategory === cat ? "active" : ""}`}
                    onClick={() => setSelectedCourseCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <div className="filter-group">
                <span className="filter-label">Expertise Level</span>
                {courseLevels.map((lvl) => (
                  <button
                    key={lvl}
                    className={`premium-chip ${selectedCourseLevel === lvl ? "active" : ""}`}
                    onClick={() => setSelectedCourseLevel(lvl)}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {loadingCourses ? (
              <div className="premium-empty-state">
                <div className="premium-loader"></div>
                <h3 style={{ marginTop: "2rem" }}>
                  Synchronizing Curriculum...
                </h3>
              </div>
            ) : filtered.length > 0 ? (
              <div className="my-courses-grid-modern">
                {filtered.map((course) => (
                  <div
                    className="course-item-card-mini"
                    key={course.id}
                    onClick={() => navigate(`/admin/details/${course.id}`)}
                  >
                    <div className="card-thumb-area">
                      <img
                        src={
                          course.thumbnail ||
                          "https://images.unsplash.com/photo-1516321318423-f06f85e504b3"
                        }
                        alt={course.title}
                        onError={(e) => {
                          e.target.src =
                            "https://images.unsplash.com/photo-1516321318423-f06f85e504b3";
                        }}
                      />
                      <div className="card-overlay-gradient"></div>
                      <div className="card-badge-premium">
                        {course.level || "Beginner"}
                      </div>
                    </div>
                    <div className="course-item-details">
                      <div className="card-meta-row">
                        <span className="premium-cat-tag">
                          {course.category}
                        </span>
                        <span className="topic-count">
                          <FiClock /> {course.chapters?.length || 0} Lessons
                        </span>
                      </div>
                      <h3>{course.title}</h3>

                      <div
                        className="course-footer-premium"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="action-group">
                          <button
                            className="glass-action-btn edit"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditCourse(course);
                            }}
                          >
                            <FiEdit3 /> Edit
                          </button>
                          <button
                            className="glass-action-btn delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCourse(course.id);
                            }}
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="premium-empty-state">
                <span className="empty-visual">🔍</span>
                <h3>No Trainings Discovered</h3>
                <p>
                  We couldn't find any trainings matching your current
                  selection. Try adjusting your filters or search query.
                </p>
                <button
                  className="reset-filter-btn"
                  onClick={() => {
                    setSelectedCourseCategory("All");
                    setSelectedCourseLevel("All");
                    setSearchQuery("");
                  }}
                >
                  Refresh Search
                </button>
              </div>
            )}
          </div>
        );
      }

      case "Upload Assignment":
      case "Upload Quiz":
        return (
          <div className="edu-content-scroll">
            <section className="edu-section premium-padding">
              <h2 className="section-title">
                Step 1: {currentTab === "Upload Quiz" ? "Quiz" : "Assignment"}{" "}
                Details
              </h2>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Select Associated Training Module</label>
                  <select
                    style={{
                      width: "100%",
                      padding: "0.8rem",
                      background: "transparent",
                      border: "1px solid var(--border-color)",
                      color: "var(--text-main)",
                      borderRadius: "8px",
                      cursor: "pointer",
                    }}
                    value={assignmentData.courseId || ""}
                    onChange={(e) =>
                      setAssignmentData({
                        ...assignmentData,
                        courseId: e.target.value,
                      })
                    }
                  >
                    <option value="" style={{ color: "black" }}>
                      -- Choose Training --
                    </option>
                    {myCourses.map((c) => (
                      <option
                        key={c.id}
                        value={c.id}
                        style={{ color: "black" }}
                      >
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group full-width">
                  <label>
                    {currentTab === "Upload Quiz"
                      ? "Quiz Title"
                      : "Assignment Title"}
                  </label>
                  <input
                    type="text"
                    placeholder={`e.g. ${currentTab === "Upload Quiz" ? "Module 1 Mastery Quiz" : "End of Training Assessment"}`}
                    value={assignmentData.title || ""}
                    onChange={(e) =>
                      setAssignmentData({
                        ...assignmentData,
                        title: e.target.value,
                      })
                    }
                    style={{
                      width: "100%",
                      padding: "0.8rem",
                      background: "transparent",
                      border: "1px solid var(--border-color)",
                      color: "var(--text-main)",
                      borderRadius: "8px",
                    }}
                  />
                </div>
                <div className="form-group full-width">
                  <label>Description & Instructions (Optional)</label>
                  <textarea
                    rows="3"
                    placeholder="Provide any necessary guidelines..."
                    value={assignmentData.description || ""}
                    onChange={(e) =>
                      setAssignmentData({
                        ...assignmentData,
                        description: e.target.value,
                      })
                    }
                    style={{
                      width: "100%",
                      padding: "0.8rem",
                      background: "transparent",
                      border: "1px solid var(--border-color)",
                      color: "var(--text-main)",
                      borderRadius: "8px",
                    }}
                  ></textarea>
                </div>
                <div className="form-group">
                  <label>Target Audience (Role)</label>
                  <select
                    style={{
                      width: "100%",
                      padding: "0.8rem",
                      background: "transparent",
                      border: "1px solid var(--border-color)",
                      color: "var(--text-main)",
                      borderRadius: "8px",
                      cursor: "pointer",
                    }}
                    value={assignmentData.role || "learner"}
                    onChange={(e) =>
                      setAssignmentData({
                        ...assignmentData,
                        role: e.target.value,
                      })
                    }
                  >
                    <option value="learner" style={{ color: "black" }}>
                      Learner (Standard Users)
                    </option>
                    <option value="admin" style={{ color: "black" }}>
                      Admin (Internal Staff)
                    </option>
                  </select>
                </div>
              </div>
            </section>

            <section
              className="edu-section premium-padding"
              style={{ marginTop: "2rem" }}
            >
              <div
                className="section-header-flex"
                style={{
                  marginBottom: "1rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <h2 className="section-title" style={{ margin: 0 }}>
                  Step 2: {currentTab === "Upload Quiz" ? "Quiz" : "Assignment"}{" "}
                  Questions
                </h2>
                <span
                  className="course-stats-mini"
                  style={{
                    background: "var(--primary-blue)",
                    color: "white",
                    padding: "0.3rem 1rem",
                    borderRadius: "100px",
                    fontSize: "0.85rem",
                    fontWeight: "bold",
                  }}
                >
                  {assignmentQuestions.length} Questions Included
                </span>
              </div>
              <div
                className="lectures-list"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1.5rem",
                }}
              >
                {assignmentQuestions.map((q, qIdx) => (
                  <div
                    className="lecture-item-card"
                    key={qIdx}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "1.5rem",
                      padding: "2.5rem",
                      background: "var(--card-bg)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "20px",
                      alignItems: "stretch", // Override base CSS centering
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.8rem",
                        }}
                      >
                        <div
                          style={{
                            width: "8px",
                            height: "24px",
                            background: "var(--primary-blue)",
                            borderRadius: "100px",
                          }}
                        ></div>
                        <h4
                          style={{
                            margin: 0,
                            fontSize: "1.2rem",
                            fontWeight: "800",
                            color: "var(--text-main)",
                          }}
                        >
                          Question {qIdx + 1}
                        </h4>
                      </div>
                      {assignmentQuestions.length > 1 && (
                        <button
                          className="del-btn"
                          style={{
                            background: "rgba(239, 68, 68, 0.1)",
                            color: "#ef4444",
                            border: "none",
                            padding: "0.4rem 1rem",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontWeight: "bold",
                          }}
                          onClick={() => {
                            const arr = [...assignmentQuestions];
                            arr.splice(qIdx, 1);
                            setAssignmentQuestions(arr);
                          }}
                        >
                          Remove Question
                        </button>
                      )}
                    </div>
                    <div>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "0.5rem",
                          color: "var(--text-sub)",
                          fontSize: "0.9rem",
                          fontWeight: "600",
                        }}
                      >
                        Question Text
                      </label>
                      <input
                        type="text"
                        placeholder="What is the main objective of..."
                        style={{
                          width: "100%",
                          padding: "1rem",
                          background: "transparent",
                          border: "1px solid var(--border-color)",
                          color: "var(--text-main)",
                          borderRadius: "12px",
                          fontSize: "1rem",
                          outline: "none",
                          transition: "border-color 0.2s ease",
                        }}
                        onFocus={(e) =>
                          (e.target.style.borderColor = "var(--primary-blue)")
                        }
                        onBlur={(e) =>
                          (e.target.style.borderColor = "var(--border-color)")
                        }
                        value={q.question || ""}
                        onChange={(e) => {
                          const arr = [...assignmentQuestions];
                          arr[qIdx].question = e.target.value;
                          setAssignmentQuestions(arr);
                        }}
                      />
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: "0.8rem",
                        marginBottom: "1.2rem",
                        padding: "0.3rem",
                        background: "rgba(0,0,0,0.05)",
                        borderRadius: "12px",
                        width: "fit-content",
                      }}
                    >
                      {["mcq", "checkbox"].map((type) => (
                        <button
                          key={type}
                          onClick={() => {
                            const arr = [...assignmentQuestions];
                            arr[qIdx].question_type = type;
                            if (type === "mcq") arr[qIdx].correct_options = "0";
                            setAssignmentQuestions(arr);
                          }}
                          style={{
                            padding: "0.6rem 1.2rem",
                            borderRadius: "10px",
                            border: "none",
                            background:
                              q.question_type === type
                                ? "var(--primary-blue)"
                                : "transparent",
                            color:
                              q.question_type === type
                                ? "white"
                                : "var(--text-sub)",
                            cursor: "pointer",
                            fontSize: "0.85rem",
                            fontWeight: "700",
                            transition: "all 0.2s ease",
                            boxShadow:
                              q.question_type === type
                                ? "0 4px 12px rgba(251, 146, 60, 0.3)"
                                : "none",
                          }}
                        >
                          {type === "mcq"
                            ? "Multiple Choice"
                            : "Multiple Answers"}
                        </button>
                      ))}
                    </div>

                    {q.question_type === "mcq" ||
                      q.question_type === "checkbox" ? (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.8rem",
                          marginTop: "0.5rem",
                        }}
                      >
                        <label
                          style={{
                            display: "block",
                            marginTop: "0.5rem",
                            marginBottom: "0.5rem",
                            color: "var(--text-sub)",
                            fontSize: "0.9rem",
                            fontWeight: "700",
                          }}
                        >
                          Options{" "}
                          <span style={{ fontWeight: 400 }}>
                            (
                            {q.question_type === "mcq"
                              ? "Select 1 correct answer"
                              : "Select all correct answers"}
                            )
                          </span>
                        </label>
                        {q.options.map((opt, oIdx) => (
                          <div
                            key={oIdx}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "1.2rem",
                              background: (q.correct_options || "")
                                .split(",")
                                .includes(String(oIdx))
                                ? "rgba(16, 185, 129, 0.1)"
                                : "transparent",
                              padding: "0.5rem",
                              borderRadius: "8px",
                            }}
                          >
                            <input
                              type={
                                q.question_type === "mcq" ? "radio" : "checkbox"
                              }
                              name={`correct-opt-${qIdx}`}
                              checked={(q.correct_options || "")
                                .split(",")
                                .includes(String(oIdx))}
                              onChange={() => {
                                const arr = [...assignmentQuestions];
                                let currentOptions = arr[qIdx].correct_options
                                  ? (arr[qIdx].correct_options || "").split(",")
                                  : [];

                                if (q.question_type === "mcq") {
                                  arr[qIdx].correct_options = String(oIdx);
                                } else {
                                  if (currentOptions.includes(String(oIdx))) {
                                    currentOptions = currentOptions.filter(
                                      (id) => id !== String(oIdx),
                                    );
                                  } else {
                                    currentOptions.push(String(oIdx));
                                  }
                                  arr[qIdx].correct_options =
                                    currentOptions.join(",");
                                }
                                setAssignmentQuestions(arr);
                              }}
                              style={{
                                cursor: "pointer",
                                width: "22px",
                                height: "22px",
                                accentColor: "#10b981",
                              }}
                              title="Mark as correct option"
                            />
                            <input
                              type="text"
                              placeholder={`Option ${oIdx + 1}`}
                              style={{
                                flex: 1,
                                padding: "0.8rem",
                                background: "var(--bg-color)",
                                border: (q.correct_options || "")
                                  .split(",")
                                  .includes(String(oIdx))
                                  ? "1px solid #10b981"
                                  : "1px solid var(--border-color)",
                                color: "var(--text-main)",
                                borderRadius: "6px",
                              }}
                              value={opt || ""}
                              onChange={(e) => {
                                const arr = [...assignmentQuestions];
                                arr[qIdx].options[oIdx] = e.target.value;
                                setAssignmentQuestions(arr);
                              }}
                            />
                            {q.options.length > 2 && (
                              <button
                                style={{
                                  background: "rgba(239, 68, 68, 0.1)",
                                  border: "none",
                                  color: "#ef4444",
                                  padding: "0.6rem 1rem",
                                  borderRadius: "6px",
                                  cursor: "pointer",
                                  fontWeight: "bold",
                                }}
                                onClick={() => {
                                  const arr = [...assignmentQuestions];
                                  arr[qIdx].options.splice(oIdx, 1);
                                  // Update indices after removal
                                  let currentIds = (arr[qIdx].correct_options || "")
                                    .split(",")
                                    .map(Number);
                                  currentIds = currentIds.filter(
                                    (id) => id < arr[qIdx].options.length,
                                  );
                                  if (currentIds.length === 0) currentIds = [0];
                                  arr[qIdx].correct_options =
                                    currentIds.join(",");

                                  setAssignmentQuestions(arr);
                                }}
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        ))}
                        <div style={{ marginTop: "0.5rem" }}>
                          <button
                            style={{
                              padding: "0.8rem 1.5rem",
                              background: "transparent",
                              border: "2px dashed var(--border-color)",
                              color: "var(--primary-blue)",
                              borderRadius: "12px",
                              cursor: "pointer",
                              fontWeight: "700",
                              fontSize: "0.9rem",
                              transition: "all 0.2s ease",
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                              width: "fit-content",
                            }}
                            onMouseOver={(e) => {
                              e.target.style.background =
                                "rgba(251, 146, 60, 0.05)";
                              e.target.style.borderColor =
                                "var(--primary-blue)";
                            }}
                            onMouseOut={(e) => {
                              e.target.style.background = "transparent";
                              e.target.style.borderColor =
                                "var(--border-color)";
                            }}
                            onClick={() => {
                              const arr = [...assignmentQuestions];
                              arr[qIdx].options.push("");
                              setAssignmentQuestions(arr);
                            }}
                          >
                            <span style={{ fontSize: "1.4rem" }}>+</span> Add
                            Option
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ))}
                <button
                  className="publish-btn"
                  style={{
                    marginTop: "1.5rem",
                    alignSelf: "flex-start",
                    padding: "1rem 2.5rem",
                    fontSize: "1rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.8rem",
                  }}
                  onClick={() => {
                    const arr = [...assignmentQuestions];
                    arr.push({
                      question: "",
                      options: ["", ""],
                      correct_options: "0",
                      question_type: "mcq",
                      correct_answer_text: "",
                    });
                    setAssignmentQuestions(arr);
                  }}
                >
                  <span style={{ fontSize: "1.4rem" }}>+</span> Add New Question
                </button>
              </div>
            </section>
          </div>
        );

      case "Profile":
        return (
          <div className="edu-content-scroll">
            <section className="edu-section premium-padding">
              <h2 className="section-title">Public Profile Settings</h2>
              <div className="profile-edit-grid">
                <div className="profile-avatar-area">
                  <div className="avatar-preview-big">
                    <img
                      src={
                        courseData.avatar ||
                        "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                      }
                      alt="Profile"
                    />
                  </div>
                  <div className="avatar-inputs">
                    <label>Profile Image</label>
                    <input
                      type="file"
                      id="edu-avatar-upload"
                      hidden
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                    <button
                      className="upload-avatar-btn-modern"
                      onClick={() =>
                        document.getElementById("edu-avatar-upload").click()
                      }
                    >
                      Update Photo
                    </button>
                    <p
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--text-sub)",
                        marginTop: "0.5rem",
                      }}
                    >
                      Recommended: Square JPG or PNG.
                    </p>
                  </div>
                </div>

                <div className="profile-details-area">
                  <div className="form-group-modern">
                    <label>Full Name</label>
                    <input
                      type="text"
                      value={courseData.full_name || ""}
                      onChange={(e) =>
                        setCourseData({
                          ...courseData,
                          full_name: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="form-group-modern">
                    <label>Professional Bio</label>
                    <textarea
                      rows="5"
                      placeholder="Write a short summary about your expertise..."
                      value={courseData.bio || ""}
                      onChange={(e) =>
                        setCourseData({ ...courseData, bio: e.target.value })
                      }
                    ></textarea>
                  </div>
                  <button
                    className="save-profile-glow"
                    onClick={handleSaveProfile}
                    disabled={isUploading}
                  >
                    {isUploading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </section>
          </div>
        );

      case "Training Details":
        return (
          <div
            className="edu-content-scroll"
            style={{ padding: 0 }}
          >
            <div style={{ padding: "2rem 2.5rem" }}>
              <div
                className="details-back-btn"
                onClick={() => navigate("/admin/All Trainings")}
                style={{
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  color: "var(--primary-blue)",
                  fontWeight: "bold",
                  marginBottom: "1rem",
                  paddingLeft: "2.5rem",
                  paddingTop: "2rem",
                }}
              >
                ← Return to Module Library
              </div>

              {/* Status Banner */}
              <div
                style={{
                  margin: "0 2.5rem 2rem 2.5rem",
                  padding: "1.25rem 2rem",
                  background: "var(--gradient-orange)",
                  borderRadius: "15px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  boxShadow: "0 10px 25px rgba(180, 133, 48, 0.2)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                    color: "#000",
                  }}
                >
                  <FiCheckCircle size={24} />
                  <div>
                    <h4
                      style={{
                        margin: 0,
                        fontWeight: "900",
                        fontSize: "1.1rem",
                      }}
                    >
                      Enterprise Quality Audit Mode
                    </h4>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "0.85rem",
                        opacity: 0.8,
                        fontWeight: 700,
                      }}
                    >
                      You are viewing this module as an administrator. All
                      content is ready for learner deployment.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/admin/edit/${courseId}`)}
                  style={{
                    background: "white",
                    border: "none",
                    padding: "0.6rem 1.2rem",
                    borderRadius: "100px",
                    fontWeight: "800",
                    fontSize: "0.85rem",
                    cursor: "pointer",
                  }}
                >
                  Edit Module Details
                </button>
              </div>

              <div
                className={`admin-dashboard-container ${isDarkMode ? "admin-dark" : "admin-light"}`}
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  padding: "0 2.5rem 4rem 2.5rem",
                }}
              >
                <div
                  className="player-container"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(0, 1fr) 400px",
                    gap: "2.5rem",
                    padding: 0,
                  }}
                >
                  <div
                    className="video-section"
                    style={{
                      border: "1px solid var(--border-color)",
                      background: "var(--card-bg)",
                      borderRadius: "30px",
                      overflow: "hidden",
                    }}
                  >
                    <div className="video-wrapper">
                      {activeVideoUrl ? (
                        <iframe
                          src={
                            activeVideoUrl
                              .replace("watch?v=", "embed/")
                              .split("&")[0] + "?enablejsapi=1"
                          }
                          title="Course Audit"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        ></iframe>
                      ) : (
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "#000",
                          }}
                        >
                          {courseData.thumbnail && (
                            <img
                              src={courseData.thumbnail}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                opacity: 0.3,
                              }}
                              alt="Thumbnail"
                            />
                          )}
                          <div
                            style={{
                              position: "absolute",
                              color: "white",
                              textAlign: "center",
                              padding: "2rem",
                            }}
                          >
                            <div
                              style={{
                                width: "80px",
                                height: "80px",
                                background: "rgba(255,255,255,0.1)",
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                margin: "0 auto 1.5rem auto",
                                border: "1px solid rgba(255,255,255,0.2)",
                              }}
                            >
                              <span style={{ fontSize: "2rem" }}>🎬</span>
                            </div>
                            <h2
                              style={{
                                fontSize: "1.8rem",
                                fontWeight: "900",
                                marginBottom: "0.5rem",
                              }}
                            >
                              Curriculum Audit Mode
                            </h2>
                            <p
                              style={{
                                opacity: 0.8,
                                maxWidth: "400px",
                                margin: "0 auto",
                              }}
                            >
                              Select any chapter from the curriculum sidebar to
                              start reviewing the content and video quality.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="video-info" style={{ padding: "2.5rem" }}>
                      <div
                        style={{
                          display: "flex",
                          gap: "0.75rem",
                          marginBottom: "1.2rem",
                        }}
                      >
                        <span
                          className="unit-badge"
                          style={{
                            background: "rgba(59, 130, 246, 0.1)",
                            color: "var(--primary-blue)",
                            border: "1px solid rgba(59, 130, 246, 0.2)",
                          }}
                        >
                          {courseData.category}
                        </span>
                        <span
                          className="unit-badge"
                          style={{
                            background: "rgba(255,255,255,0.05)",
                            color: "var(--text-sub)",
                          }}
                        >
                          {courseData.level}
                        </span>
                      </div>
                      <h1
                        style={{
                          fontSize: "2.8rem",
                          fontWeight: "900",
                          letterSpacing: "-1.5px",
                          color: "var(--text-main)",
                        }}
                      >
                        {courseData.title}
                      </h1>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "1.5rem",
                          marginTop: "1.2rem",
                          color: "var(--text-sub)",
                          fontWeight: "700",
                          fontSize: "1rem",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                          }}
                        >
                          <div
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "50%",
                              background: "var(--gradient-orange)",
                              border: "2px solid white",
                              boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                            }}
                          ></div>
                          <span
                            style={{
                              color: "var(--primary-blue)",
                              fontWeight: 800,
                            }}
                          >
                            {courseData.tutor_name || "Oges Executive Expert"}
                          </span>
                        </div>
                        <span>•</span>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <FiLayers color="var(--primary-blue)" />
                          <span>
                            {units.reduce(
                              (acc, u) => acc + u.chapters.length,
                              0,
                            )}{" "}
                            Professional Lectures
                          </span>
                        </div>
                      </div>
                      <div
                        style={{
                          marginTop: "2.5rem",
                          borderTop: "1px solid var(--border-color)",
                          paddingTop: "2.5rem",
                        }}
                      >
                        <h3
                          style={{
                            fontSize: "1.4rem",
                            fontWeight: "800",
                            marginBottom: "1.2rem",
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                          }}
                        >
                          <FiBook /> Syllabus Overview
                        </h3>
                        <p
                          style={{
                            lineHeight: "1.9",
                            color: "var(--text-sub)",
                            fontSize: "1.1rem",
                          }}
                        >
                          {courseData.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  <aside
                    className="chapters-sidebar"
                    style={{ maxHeight: "1000px" }}
                  >
                    <div className="sidebar-tabs">
                      <button
                        className={detailTab === "Curriculum" ? "active" : ""}
                        onClick={() => setDetailTab("Curriculum")}
                      >
                        Curriculum
                      </button>
                      <button
                        className={
                          detailTab === "Announcements" ? "active" : ""
                        }
                        onClick={() => setDetailTab("Announcements")}
                      >
                        Announcements
                      </button>
                      <button
                        className={detailTab === "Resources" ? "active" : ""}
                        onClick={() => setDetailTab("Resources")}
                      >
                        Resources
                      </button>
                    </div>

                    {detailTab === "Curriculum" ? (
                      <>
                        <h3>Course Content</h3>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "1rem",
                            maxHeight: "700px",
                            overflowY: "auto",
                            paddingRight: "0.5rem",
                          }}
                        >
                          {units.map((unit, uIdx) => (
                            <div key={uIdx} className="unit-item">
                              <div
                                className="unit-header"
                                style={{ marginBottom: "0.5rem" }}
                              >
                                <h4>{unit.title || `Unit ${uIdx + 1}`}</h4>
                                <span className="unit-badge">
                                  {unit.chapters.length} Lectures
                                </span>
                              </div>
                              <div
                                className="unit-chapters"
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: "0.4rem",
                                }}
                              >
                                {unit.chapters.map((chap, cIdx) => (
                                  <div
                                    key={cIdx}
                                    className={`chapter-item ${activeVideoUrl === chap.videoUrl ? "active" : ""}`}
                                    onClick={() => {
                                      if (chap.videoUrl)
                                        setActiveVideoUrl(chap.videoUrl);
                                    }}
                                    style={{
                                      padding: "0.8rem 1rem",
                                      borderRadius: "12px",
                                      border:
                                        activeVideoUrl === chap.videoUrl
                                          ? "1px solid var(--primary-blue)"
                                          : "1px solid transparent",
                                    }}
                                  >
                                    <div
                                      className="chapter-num"
                                      style={{
                                        width: "26px",
                                        height: "26px",
                                        fontSize: "0.75rem",
                                      }}
                                    >
                                      {cIdx + 1}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                      <span
                                        className="chapter-title"
                                        style={{
                                          fontSize: "0.9rem",
                                          display: "block",
                                        }}
                                      >
                                        {chap.title}
                                      </span>
                                      <span
                                        style={{
                                          fontSize: "0.7rem",
                                          color: "var(--text-sub)",
                                          textTransform: "uppercase",
                                          fontWeight: "700",
                                        }}
                                      >
                                        {chap.videoUrl
                                          ? "✓ Quality OK"
                                          : "⚠ Action Req."}
                                      </span>
                                    </div>
                                    {activeVideoUrl === chap.videoUrl && (
                                      <div
                                        style={{ color: "var(--primary-blue)" }}
                                      >
                                        ▶
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : detailTab === "Resources" ? (
                      <div className="resources-audit-area">
                        <h3
                          style={{ fontSize: "1.2rem", marginBottom: "1.2rem" }}
                        >
                          Training Resources
                        </h3>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "1rem",
                            maxHeight: "700px",
                            overflowY: "auto",
                          }}
                        >
                          {units.map((unit, uIdx) => (
                            <div key={uIdx} style={{ marginBottom: "1.5rem" }}>
                              <h4
                                style={{
                                  fontSize: "0.9rem",
                                  color: "var(--primary-blue)",
                                  marginBottom: "0.8rem",
                                  textTransform: "uppercase",
                                }}
                              >
                                {unit.title}
                              </h4>
                              {unit.chapters.map((chap, cIdx) => (
                                <div
                                  key={cIdx}
                                  style={{
                                    marginBottom: "0.8rem",
                                    paddingLeft: "1rem",
                                    borderLeft: "2px solid var(--border-color)",
                                  }}
                                >
                                  <div
                                    style={{
                                      fontSize: "0.85rem",
                                      fontWeight: "700",
                                      marginBottom: "0.5rem",
                                    }}
                                  >
                                    {chap.title}
                                  </div>
                                  {(chap.resources || []).length > 0 ? (
                                    <div
                                      style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "0.5rem",
                                      }}
                                    >
                                      {chap.resources.map((res, rIdx) => (
                                        <div
                                          key={rIdx}
                                          style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "0.6rem",
                                            padding: "0.6rem",
                                            background:
                                              "rgba(255,255,255,0.03)",
                                            borderRadius: "8px",
                                            fontSize: "0.8rem",
                                          }}
                                        >
                                          <span>
                                            {res.file_type === "pdf"
                                              ? "📄"
                                              : "🔗"}
                                          </span>
                                          <span style={{ flex: 1 }}>
                                            {res.title}
                                          </span>
                                          <a
                                            href={res.file_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            style={{
                                              color: "var(--primary-blue)",
                                              textDecoration: "none",
                                              fontWeight: "700",
                                            }}
                                          >
                                            View / Download
                                          </a>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div
                                      style={{
                                        fontSize: "0.75rem",
                                        color: "var(--text-sub)",
                                      }}
                                    >
                                      No resources added for this chapter.
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="announcements-audit-area">
                        <h3>Post Update</h3>
                        <p
                          style={{
                            fontSize: "0.85rem",
                            color: "var(--text-sub)",
                            marginBottom: "1rem",
                          }}
                        >
                          Announcements will be visible to all students enrolled
                          in this course.
                        </p>
                        <textarea
                          placeholder="Type your announcement here..."
                          value={announcementText}
                          onChange={(e) => setAnnouncementText(e.target.value)}
                          style={{
                            width: "100%",
                            height: "120px",
                            padding: "1rem",
                            borderRadius: "12px",
                            background: "rgba(255,255,255,0.03)",
                            border: "1px solid var(--border-color)",
                            color: "white",
                            marginBottom: "1rem",
                          }}
                        />
                        <button
                          className="publish-btn"
                          style={{ width: "100%" }}
                          onClick={handlePostAnnouncement}
                          disabled={isPostingAnnouncement}
                        >
                          {isPostingAnnouncement
                            ? "Posting..."
                            : "Post Announcement"}
                        </button>

                        <div style={{ marginTop: "2rem" }}>
                          <h4
                            style={{
                              fontSize: "1rem",
                              fontWeight: "700",
                              marginBottom: "1rem",
                            }}
                          >
                            Recent Announcements
                          </h4>
                          {announcements.map((ann, idx) => (
                            <div
                              key={idx}
                              style={{
                                padding: "1rem",
                                borderRadius: "12px",
                                background: "rgba(255,255,255,0.02)",
                                border: "1px solid var(--border-color)",
                                marginBottom: "0.8rem",
                              }}
                            >
                              <p
                                style={{
                                  fontSize: "0.9rem",
                                  color: "white",
                                  marginBottom: "0.5rem",
                                }}
                              >
                                {ann.content}
                              </p>
                              <span
                                style={{
                                  fontSize: "0.7rem",
                                  color: "var(--text-sub)",
                                }}
                              >
                                {new Date(ann.timestamp).toLocaleDateString()}
                              </span>
                            </div>
                          ))}
                          {announcements.length === 0 && (
                            <p
                              style={{
                                fontSize: "0.85rem",
                                color: "var(--text-sub)",
                                textAlign: "center",
                              }}
                            >
                              No announcements yet.
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </aside>
                </div>
              </div>
            </div>
          </div>
        );

      case "My Assignments":
        return (
          <div className="edu-content-scroll">
            <section className="edu-section premium-padding">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "1.5rem",
                }}
              >
                <h2 className="section-title">My Uploaded Assignments</h2>
                <button
                  className="publish-btn"
                  onClick={() => setCurrentTab("Upload Assignment")}
                >
                  + New Assignment
                </button>
              </div>

              <div
                className="assignments-table-glow"
                style={{
                  background: "var(--card-bg)",
                  borderRadius: "1.5rem",
                  border: "1px solid var(--border-color)",
                  overflow: "hidden",
                }}
              >
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead
                    style={{
                      background: "rgba(0,0,0,0.02)",
                      borderBottom: "1px solid var(--border-color)",
                    }}
                  >
                    <tr>
                      <th style={{ padding: "1.2rem", textAlign: "left" }}>
                        Assignment Title
                      </th>
                      <th style={{ padding: "1.2rem", textAlign: "left" }}>
                        Category
                      </th>
                      <th style={{ padding: "1.2rem", textAlign: "left" }}>
                        Target Role
                      </th>
                      <th style={{ padding: "1.2rem", textAlign: "left" }}>
                        Reward
                      </th>
                      <th style={{ padding: "1.2rem", textAlign: "center" }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {myAssignments.map((a) => (
                      <tr
                        key={a.id}
                        style={{
                          borderBottom: "1px solid var(--border-color)",
                          cursor: "pointer",
                          transition: "background 0.2s",
                        }}
                        onClick={() => setSelectedPreviewAssignment(a)}
                        onMouseOver={(e) =>
                        (e.currentTarget.style.background =
                          "rgba(255,255,255,0.02)")
                        }
                        onMouseOut={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                      >
                        <td style={{ padding: "1.2rem", fontWeight: "600" }}>
                          {a.title}
                        </td>
                        <td style={{ padding: "1.2rem" }}>
                          <span
                            style={{
                              background: "rgba(59,130,246,0.1)",
                              color: "var(--primary-blue)",
                              padding: "4px 10px",
                              borderRadius: "6px",
                              fontSize: "0.8rem",
                            }}
                          >
                            {a.category}
                          </span>
                        </td>
                        <td
                          style={{
                            padding: "1.2rem",
                            textTransform: "capitalize",
                          }}
                        >
                          {a.role}
                        </td>
                        <td style={{ padding: "1.2rem" }}>{a.reward_badge}</td>
                        <td
                          style={{ padding: "1.2rem", textAlign: "center" }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            style={{
                              background: "transparent",
                              border: "none",
                              color: "var(--primary-blue)",
                              cursor: "pointer",
                              fontWeight: "700",
                            }}
                            onClick={() => handleEditAssignment(a)}
                          >
                            Edit
                          </button>
                          <button
                            style={{
                              background: "transparent",
                              border: "none",
                              color: "#ef4444",
                              cursor: "pointer",
                              fontWeight: "700",
                              marginLeft: "1rem",
                            }}
                            onClick={() => handleDeleteAssignment(a.id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                    {myAssignments.length === 0 && (
                      <tr>
                        <td
                          colSpan="5"
                          style={{
                            padding: "4rem",
                            textAlign: "center",
                            color: "var(--text-sub)",
                          }}
                        >
                          No assignments uploaded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        );

      case "Submissions":
        return (
          <div className="edu-content-scroll">
            <section
              className="edu-section"
              style={{
                borderRadius: "1.5rem",
                background: "var(--card-bg)",
                border: "1px solid var(--border-color)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "2.5rem",
                  borderBottom: "1px solid var(--border-color)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <h2
                    style={{
                      fontSize: "1.8rem",
                      fontWeight: "900",
                      color: "var(--text-main)",
                    }}
                  >
                    Assessment Submissions
                  </h2>
                  <p
                    style={{
                      color: "var(--text-sub)",
                      fontSize: "0.95rem",
                      marginTop: "0.4rem",
                    }}
                  >
                    Tracking all learner assignment & quiz completions globally.
                  </p>
                </div>
                <div
                  style={{
                    background: "rgba(59,130,246,0.1)",
                    color: "var(--primary-blue)",
                    padding: "0.8rem 1.5rem",
                    borderRadius: "12px",
                    fontWeight: "800",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <span style={{ fontSize: "1.2rem" }}>📈</span>{" "}
                  {submissions.length} Total Submissions
                </div>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    textAlign: "left",
                  }}
                >
                  <thead
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      borderBottom: "1px solid var(--border-color)",
                    }}
                  >
                    <tr>
                      <th
                        style={{
                          padding: "1.2rem 2.5rem",
                          color: "var(--text-sub)",
                          textTransform: "uppercase",
                          fontSize: "0.75rem",
                          letterSpacing: "1px",
                        }}
                      >
                        Learner
                      </th>
                      <th
                        style={{
                          padding: "1.2rem",
                          color: "var(--text-sub)",
                          textTransform: "uppercase",
                          fontSize: "0.75rem",
                          letterSpacing: "1px",
                        }}
                      >
                        Assessment
                      </th>
                      <th
                        style={{
                          padding: "1.2rem",
                          color: "var(--text-sub)",
                          textTransform: "uppercase",
                          fontSize: "0.75rem",
                          letterSpacing: "1px",
                        }}
                      >
                        Type
                      </th>
                      <th
                        style={{
                          padding: "1.2rem",
                          color: "var(--text-sub)",
                          textTransform: "uppercase",
                          fontSize: "0.75rem",
                          letterSpacing: "1px",
                        }}
                      >
                        Completion Date
                      </th>
                      <th
                        style={{
                          padding: "1.2rem",
                          color: "var(--text-sub)",
                          textTransform: "uppercase",
                          fontSize: "0.75rem",
                          letterSpacing: "1px",
                        }}
                      >
                        Reward Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map((s) => (
                      <tr
                        key={s.id}
                        style={{
                          borderBottom: "1px solid var(--border-color)",
                          transition: "background 0.2s",
                          borderLeft: "3px solid transparent",
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.background =
                            "rgba(255,255,255,0.01)";
                          e.currentTarget.style.borderLeftColor =
                            "var(--primary-blue)";
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.borderLeftColor = "transparent";
                        }}
                      >
                        <td style={{ padding: "1.2rem 2.5rem" }}>
                          <div
                            style={{
                              fontWeight: "700",
                              color: "var(--text-main)",
                              fontSize: "1rem",
                            }}
                          >
                            {s.student_name}
                          </div>
                          <div
                            style={{
                              fontSize: "0.85rem",
                              color: "var(--text-sub)",
                            }}
                          >
                            {s.student_email}
                          </div>
                        </td>
                        <td style={{ padding: "1.2rem" }}>
                          <div
                            style={{
                              fontWeight: "700",
                              color: "var(--text-main)",
                            }}
                          >
                            {s.title}
                          </div>
                          <div
                            style={{
                              fontSize: "0.7rem",
                              color: "var(--text-sub)",
                              fontWeight: "800",
                              textTransform: "uppercase",
                              marginTop: "0.2rem",
                            }}
                          >
                            {s.category}
                          </div>
                        </td>
                        <td style={{ padding: "1.2rem" }}>
                          <span
                            style={{
                              padding: "6px 14px",
                              background:
                                s.type === "quiz"
                                  ? "rgba(139, 92, 246, 0.1)"
                                  : "rgba(251, 146, 60, 0.1)",
                              color: s.type === "quiz" ? "#8b5cf6" : "#fb923c",
                              borderRadius: "10px",
                              fontSize: "0.7rem",
                              fontWeight: "900",
                              textTransform: "uppercase",
                              border: "1px solid rgba(255,255,255,0.05)",
                            }}
                          >
                            {s.type}
                          </span>
                        </td>
                        <td
                          style={{
                            padding: "1.2rem",
                            color: "var(--text-sub)",
                            fontSize: "0.9rem",
                          }}
                        >
                          <div
                            style={{
                              fontWeight: "700",
                              color: "var(--text-main)",
                            }}
                          >
                            {new Date(s.timestamp).toLocaleDateString(
                              undefined,
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )}
                          </div>
                          <div style={{ fontSize: "0.8rem" }}>
                            {new Date(s.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </td>
                        <td style={{ padding: "1.2rem" }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                            }}
                          >
                            <span style={{ fontSize: "1.1rem" }}>🏅</span>
                            <span
                              style={{
                                color: "#10b981",
                                fontWeight: "800",
                                fontSize: "0.85rem",
                              }}
                            >
                              {s.reward} Granted
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {submissions.length === 0 && (
                      <tr>
                        <td
                          colSpan="5"
                          style={{ padding: "6rem", textAlign: "center" }}
                        >
                          <div
                            style={{
                              fontSize: "3rem",
                              marginBottom: "1rem",
                              opacity: 0.3,
                            }}
                          >
                            📥
                          </div>
                          <h3
                            style={{
                              color: "var(--text-main)",
                              fontWeight: "800",
                            }}
                          >
                            No Submissions Yet
                          </h3>
                          <p
                            style={{
                              color: "var(--text-sub)",
                              fontSize: "0.95rem",
                            }}
                          >
                            Learner activity will appear here once assignments
                            are completed.
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        );

      case "Graduates":
        return (
          <div className="edu-content-scroll">
            <section className="edu-section premium-padding">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "2.5rem",
                }}
              >
                <h2
                  style={{
                    fontSize: "1.8rem",
                    fontWeight: "900",
                    color: "var(--text-main)",
                  }}
                >
                  Training Graduates
                </h2>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.8rem",
                    background: "rgba(16, 185, 129, 0.1)",
                    color: "#10b981",
                    padding: "0.6rem 1.2rem",
                    borderRadius: "12px",
                    fontWeight: "800",
                  }}
                >
                  <span style={{ fontSize: "1.2rem" }}>📜</span>{" "}
                  {completions.length} Certificates Issued
                </div>
              </div>

              <div
                className="submissions-table-container-premium"
                style={{
                  background: "var(--card-bg)",
                  borderRadius: "24px",
                  border: "1px solid var(--border-color)",
                  overflow: "hidden",
                }}
              >
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    textAlign: "left",
                  }}
                >
                  <thead
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      borderBottom: "1px solid var(--border-color)",
                    }}
                  >
                    <tr>
                      <th
                        style={{
                          padding: "1.2rem 2.5rem",
                          color: "var(--text-sub)",
                          textTransform: "uppercase",
                          fontSize: "0.75rem",
                          letterSpacing: "1px",
                        }}
                      >
                        LEARNER DETAILS
                      </th>
                      <th
                        style={{
                          padding: "1.2rem",
                          color: "var(--text-sub)",
                          textTransform: "uppercase",
                          fontSize: "0.75rem",
                          letterSpacing: "1px",
                        }}
                      >
                        MODULE TITLE
                      </th>
                      <th
                        style={{
                          padding: "1.2rem",
                          color: "var(--text-sub)",
                          textTransform: "uppercase",
                          fontSize: "0.75rem",
                          letterSpacing: "1px",
                        }}
                      >
                        CERTIFICATION ID
                      </th>
                      <th
                        style={{
                          padding: "1.2rem",
                          color: "var(--text-sub)",
                          textTransform: "uppercase",
                          fontSize: "0.75rem",
                          letterSpacing: "1px",
                        }}
                      >
                        COMPLETION DATE
                      </th>
                      <th
                        style={{
                          padding: "1.2rem",
                          color: "var(--text-sub)",
                          textTransform: "uppercase",
                          fontSize: "0.75rem",
                          letterSpacing: "1px",
                        }}
                      >
                        STATUS
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {completions.map((c, idx) => (
                      <tr
                        key={idx}
                        style={{
                          borderBottom: "1px solid var(--border-color)",
                          transition: "background 0.2s",
                        }}
                        onMouseOver={(e) =>
                        (e.currentTarget.style.background =
                          "rgba(255,255,255,0.01)")
                        }
                        onMouseOut={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                      >
                        <td style={{ padding: "1.2rem 2.5rem" }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "1rem",
                            }}
                          >
                            <div
                              style={{
                                width: "40px",
                                height: "40px",
                                borderRadius: "50%",
                                background:
                                  "linear-gradient(135deg, #fb923c, #f97316)",
                                color: "white",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: "900",
                                fontSize: "0.9rem",
                              }}
                            >
                              {c.student_name ? c.student_name.charAt(0) : "S"}
                            </div>
                            <div>
                              <div
                                style={{
                                  fontWeight: "700",
                                  color: "var(--text-main)",
                                  fontSize: "0.95rem",
                                }}
                              >
                                {c.student_name}
                              </div>
                              <div
                                style={{
                                  fontSize: "0.8rem",
                                  color: "var(--text-sub)",
                                }}
                              >
                                {c.student_email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "1.2rem" }}>
                          <div
                            style={{
                              fontWeight: "700",
                              fontSize: "0.9rem",
                              color: "var(--text-main)",
                            }}
                          >
                            {c.course_title}
                          </div>
                        </td>
                        <td
                          style={{
                            padding: "1.2rem",
                            color: "var(--text-sub)",
                            fontSize: "0.85rem",
                            fontWeight: "600",
                          }}
                        >
                          OGS-
                          {c.student_name
                            ? c.student_name.substring(0, 2).toUpperCase()
                            : "ST"}
                          -{idx + 300}
                        </td>
                        <td
                          style={{
                            padding: "1.2rem",
                            color: "var(--text-sub)",
                            fontSize: "0.9rem",
                          }}
                        >
                          {new Date(c.timestamp).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                        <td style={{ padding: "1.2rem" }}>
                          <span
                            style={{
                              background: "rgba(34, 197, 94, 0.1)",
                              color: "#22c55e",
                              padding: "4px 12px",
                              borderRadius: "100px",
                              fontSize: "0.7rem",
                              fontWeight: "900",
                              border: "1px solid rgba(34, 197, 94, 0.2)",
                            }}
                          >
                            VERIFIED
                          </span>
                        </td>
                      </tr>
                    ))}
                    {completions.length === 0 && (
                      <tr>
                        <td
                          colSpan="5"
                          style={{ padding: "6rem", textAlign: "center" }}
                        >
                          <div
                            style={{
                              fontSize: "3rem",
                              marginBottom: "1rem",
                              opacity: 0.3,
                            }}
                          >
                            🎓
                          </div>
                          <h3
                            style={{
                              color: "var(--text-main)",
                              fontWeight: "800",
                            }}
                          >
                            No Graduates Yet
                          </h3>
                          <p
                            style={{
                              color: "var(--text-sub)",
                              fontSize: "0.95rem",
                            }}
                          >
                            Once learners complete 100% of your modules, they'll
                            appear here.
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="edu-dashboard">
      <aside className="edu-sidebar">
        <div className="sidebar-header">
          <span className="edu-logo"> Admin 🎓</span>
        </div>
        <nav className="sidebar-nav">
          {[
            "Dashboard",
            "All Trainings",
            "My Assignments",
            "Submissions",
            "Graduates",
            "Upload Training",
            "Upload Assignment",
            "Upload Quiz",
            "Profile",
          ].map((tab) => (
            <button
              key={tab}
              className={`sidebar-link ${currentTab === tab ? "active" : ""}`}
              onClick={() => navigate(`/admin/${tab}`)}
            >
              {tab}
            </button>
          ))}
        </nav>
        <div
          className="sidebar-footer"
          style={{
            marginTop: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <button
            className="sidebar-logout"
            onClick={onToggleTheme}
            style={{
              marginTop: "0",
              background: "rgba(255,255,255,0.05)",
              color: "var(--text-main)",
              border: "1px solid var(--border-color)",
            }}
          >
            {isDarkMode ? "🌙 Dark Mode" : "☀️ Light Mode"}
          </button>
          <button
            className="sidebar-logout"
            onClick={onLogout}
            style={{ marginTop: "0" }}
          >
            Logout
          </button>
        </div>
      </aside>

      <main className="edu-main">
        <header className="edu-header">
          <h1>{currentTab}</h1>
          <div className="header-actions">
            {currentTab === "Upload Training" && (
              <>
                <button className="preview-btn">Preview Training</button>
                <button className="publish-btn" onClick={handlePublish}>
                  Publish Now
                </button>
              </>
            )}
            {(currentTab === "Upload Assignment" ||
              currentTab === "Upload Quiz") && (
                <>
                  <button
                    className="preview-btn"
                    onClick={() => setCurrentTab("Dashboard")}
                  >
                    Cancel
                  </button>
                  <button
                    className="publish-btn"
                    onClick={handlePublishAssignment}
                  >
                    Publish {currentTab === "Upload Quiz" ? "Quiz" : "Assignment"}
                  </button>
                </>
              )}
          </div>
        </header>

        {isUploading && (
          <div className="upload-loader">
            <div className="loader-card">
              <h3>Publishing your training...</h3>
              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <span>{uploadProgress}% Complete</span>
            </div>
          </div>
        )}

        <div key={currentTab} className="dashboard-content-layer">
          {renderTabContent()}
        </div>
      </main>

      {/* Course Detail Modal */}
      {selectedPreviewCourse && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedPreviewCourse(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(8px)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
          }}
        >
          <div
            className="modal-card-premium"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--card-bg)",
              width: "100%",
              maxWidth: "800px",
              borderRadius: "24px",
              border: "1px solid var(--border-color)",
              overflow: "hidden",
              animation: "scaleUp 0.3s ease",
            }}
          >
            <div
              className="modal-header-img"
              style={{ height: "300px", position: "relative" }}
            >
              <img
                src={selectedPreviewCourse.thumbnail}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                alt="Course"
              />
              <button
                onClick={() => setSelectedPreviewCourse(null)}
                style={{
                  position: "absolute",
                  top: "1rem",
                  right: "1rem",
                  background: "rgba(0,0,0,0.5)",
                  color: "white",
                  border: "none",
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  cursor: "pointer",
                  fontSize: "1.2rem",
                }}
              >
                ✕
              </button>
            </div>
            <div
              className="modal-body-scroll"
              style={{
                padding: "2.5rem",
                maxHeight: "60vh",
                overflowY: "auto",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "start",
                  marginBottom: "1.5rem",
                }}
              >
                <div>
                  <h1
                    style={{
                      fontSize: "2rem",
                      fontWeight: "800",
                      marginBottom: "0.5rem",
                    }}
                  >
                    {selectedPreviewCourse.title}
                  </h1>
                  <span className="status-badge live">
                    {selectedPreviewCourse.category}
                  </span>
                </div>
                <button
                  className="publish-btn"
                  onClick={() => {
                    handleEditCourse(selectedPreviewCourse);
                    setSelectedPreviewCourse(null);
                  }}
                  style={{ padding: "0.8rem 2rem" }}
                >
                  Edit Course
                </button>
              </div>
              <h3
                style={{
                  color: "var(--primary-blue)",
                  marginBottom: "1rem",
                  fontSize: "1.2rem",
                }}
              >
                Description
              </h3>
              <p
                style={{
                  color: "var(--text-sub)",
                  lineHeight: "1.8",
                  marginBottom: "2.5rem",
                  fontSize: "1.05rem",
                }}
              >
                {selectedPreviewCourse.description}
              </p>

              <h3
                style={{
                  color: "var(--primary-blue)",
                  marginBottom: "1.5rem",
                  fontSize: "1.2rem",
                }}
              >
                Training Curriculum (
                {selectedPreviewCourse.chapters?.length || 0} Lectures)
              </h3>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                {selectedPreviewCourse.chapters?.map((ch, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "1.2rem",
                      borderRadius: "16px",
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid var(--border-color)",
                      display: "flex",
                      gap: "1rem",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "10px",
                        background: "var(--primary-blue)",
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "bold",
                      }}
                    >
                      {i + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontWeight: "700", marginBottom: "0.2rem" }}>
                        {ch.title}
                      </h4>
                      <p
                        style={{ fontSize: "0.9rem", color: "var(--text-sub)" }}
                      >
                        {ch.video_url || ch.videoUrl}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assignment Detail Modal */}
      {selectedPreviewAssignment && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedPreviewAssignment(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(8px)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
          }}
        >
          <div
            className="modal-card-premium"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--card-bg)",
              width: "100%",
              maxWidth: "800px",
              borderRadius: "24px",
              border: "1px solid var(--border-color)",
              overflow: "hidden",
              animation: "scaleUp 0.3s ease",
              position: "relative",
            }}
          >
            <div style={{ padding: "2.5rem" }}>
              <button
                onClick={() => setSelectedPreviewAssignment(null)}
                style={{
                  position: "absolute",
                  top: "1.5rem",
                  right: "1.5rem",
                  background: "rgba(255,255,255,0.05)",
                  color: "white",
                  border: "none",
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  cursor: "pointer",
                  fontSize: "1.2rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ✕
              </button>

              <div style={{ marginBottom: "2rem" }}>
                <span
                  className="status-badge live"
                  style={{ marginBottom: "1rem", display: "inline-block" }}
                >
                  {selectedPreviewAssignment.category} •{" "}
                  {selectedPreviewAssignment.level}
                </span>
                <h1
                  style={{
                    fontSize: "2.2rem",
                    fontWeight: "900",
                    marginBottom: "1rem",
                  }}
                >
                  {selectedPreviewAssignment.title}
                </h1>
                <p
                  style={{
                    color: "var(--text-sub)",
                    fontSize: "1.1rem",
                    lineHeight: "1.6",
                  }}
                >
                  {selectedPreviewAssignment.description}
                </p>
              </div>

              <div
                style={{
                  borderTop: "1px solid var(--border-color)",
                  paddingTop: "2rem",
                }}
              >
                <h3
                  style={{
                    color: "var(--primary-blue)",
                    marginBottom: "1.5rem",
                    fontSize: "1.3rem",
                  }}
                >
                  Assignment Questions (
                  {selectedPreviewAssignment.questions?.length || 0})
                </h3>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1.5rem",
                    maxHeight: "400px",
                    overflowY: "auto",
                    paddingRight: "1rem",
                  }}
                >
                  {selectedPreviewAssignment.questions?.map((q, qIdx) => (
                    <div
                      key={qIdx}
                      style={{
                        padding: "1.5rem",
                        borderRadius: "16px",
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid var(--border-color)",
                      }}
                    >
                      <p
                        style={{
                          fontWeight: "700",
                          fontSize: "1.1rem",
                          marginBottom: "1rem",
                        }}
                      >
                        {qIdx + 1}. {q.question_text}
                      </p>
                      {q.question_type === "mcq" ? (
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "0.8rem",
                          }}
                        >
                          {(q.options || "").split(",").map((opt, oIdx) => (
                            <div
                              key={oIdx}
                              style={{
                                padding: "0.8rem 1rem",
                                borderRadius: "10px",
                                background:
                                  oIdx === q.correct_option_index
                                    ? "rgba(34, 197, 94, 0.1)"
                                    : "rgba(255,255,255,0.03)",
                                border:
                                  oIdx === q.correct_option_index
                                    ? "1px solid rgba(34, 197, 94, 0.5)"
                                    : "1px solid var(--border-color)",
                                fontSize: "0.9rem",
                                color:
                                  oIdx === q.correct_option_index
                                    ? "#4ade80"
                                    : "var(--text-sub)",
                              }}
                            >
                              {opt} {oIdx === q.correct_option_index && "✓"}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div
                          style={{
                            padding: "1rem",
                            borderRadius: "12px",
                            background: "rgba(251, 146, 60, 0.05)",
                            border: "1px solid rgba(251, 146, 60, 0.2)",
                          }}
                        >
                          <span
                            style={{
                              color: "var(--primary-blue)",
                              fontSize: "0.8rem",
                              fontWeight: "bold",
                              display: "block",
                              marginBottom: "0.5rem",
                            }}
                          >
                            EXPECTED ANSWER:
                          </span>
                          <p style={{ color: "white", fontWeight: "600" }}>
                            {q.correct_answer_text}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                  {(!selectedPreviewAssignment.questions ||
                    selectedPreviewAssignment.questions.length === 0) && (
                      <p
                        style={{
                          textAlign: "center",
                          color: "var(--text-sub)",
                          padding: "2rem",
                        }}
                      >
                        No questions added to this assignment.
                      </p>
                    )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {showCropper && (
        <div className="cropper-modal-overlay">
          <div className="cropper-card">
            <h3 style={{ color: "var(--text-main)", textAlign: "center" }}>
              Adjust Profile Image
            </h3>
            <div
              className="cropper-container"
              style={{
                position: "relative",
                width: "100%",
                aspectRatio: "1",
                background: "#000",
                borderRadius: "16px",
                overflow: "hidden",
              }}
            >
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>
            <div
              className="cropper-controls"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.5rem",
                marginTop: "1rem",
              }}
            >
              <div
                className="zoom-slider-container"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                }}
              >
                <label
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: 800,
                    color: "var(--text-sub)",
                    textTransform: "uppercase",
                  }}
                >
                  Zoom
                </label>
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  aria-labelledby="Zoom"
                  onChange={(e) => setZoom(e.target.value)}
                  style={{ width: "100%", accentColor: "var(--primary-blue)" }}
                />
              </div>
              <div
                className="cropper-buttons"
                style={{ display: "flex", gap: "1rem" }}
              >
                <button
                  className="btn-cancel-crop"
                  onClick={() => setShowCropper(false)}
                  style={{
                    flex: 1,
                    padding: "0.85rem",
                    borderRadius: "12px",
                    border: "1px solid var(--border-color)",
                    background: "transparent",
                    color: "var(--text-main)",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  className="btn-save-crop"
                  onClick={handleUploadAvatar}
                  disabled={uploadingAvatar}
                  style={{
                    flex: 2,
                    padding: "0.85rem",
                    borderRadius: "12px",
                    border: "none",
                    background: "var(--gradient-blue)",
                    color: "white",
                    fontWeight: 900,
                    cursor: "pointer",
                    boxShadow: "0 10px 20px rgba(251, 146, 60, 0.2)",
                  }}
                >
                  {uploadingAvatar ? "Uploading..." : "Save Image"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
