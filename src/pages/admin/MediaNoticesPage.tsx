import React, { useState } from 'react';
import {
  Image,
  Video,
  FileText,
  Upload,
  Plus,
  Trash2,
  ExternalLink,
  CheckCircle,
  Database,
  Eye,
  Film,
  Camera,
  Layers,
  Sparkles,
} from 'lucide-react';
import { db } from '../../services/db';
import { Notice, MediaItem, MediaType } from '../../types';
import { useSettings } from '../../context/SettingsContext';
import { uploadFileToStorage, getSupabase } from '../../lib/supabase';
import { Modal } from '../../components/common/Modal';

export const MediaNoticesPage: React.FC = () => {
  const { formatDate } = useSettings();
  const [activeTab, setActiveTab] = useState<'media' | 'notices'>('media');

  const [mediaList, setMediaList] = useState<MediaItem[]>(() => db.getMediaItems());
  const [noticeList, setNoticeList] = useState<Notice[]>(() => db.getNotices());

  // Upload Media Modal
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [mediaTitle, setMediaTitle] = useState('');
  const [mediaDescription, setMediaDescription] = useState('');
  const [mediaType, setMediaType] = useState<MediaType>('photo');
  const [mediaTag, setMediaTag] = useState('Storefront');
  const [mediaUrlInput, setMediaUrlInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string | null>(null);

  // Notice Modal
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeCategory, setNoticeCategory] = useState<Notice['category']>('General');
  const [noticeContent, setNoticeContent] = useState('');
  const [noticeMediaUrl, setNoticeMediaUrl] = useState('');
  const [noticeMediaType, setNoticeMediaType] = useState<MediaType>('photo');
  const [noticePinned, setNoticePinned] = useState(false);

  const refresh = () => {
    setMediaList(db.getMediaItems());
    setNoticeList(db.getNotices());
  };

  // Direct file upload to Supabase Storage
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];

    setUploading(true);
    setUploadSuccessMsg(null);

    const bucketName = file.type.startsWith('video/') ? 'videos' : 'photos';
    const folderName = file.type.startsWith('video/') ? 'pharmacy-videos' : 'pharmacy-photos';

    const { url, error } = await uploadFileToStorage(file, bucketName, folderName);

    if (url) {
      setMediaUrlInput(url);
      if (!mediaTitle) {
        setMediaTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
      setMediaType(file.type.startsWith('video/') ? 'video' : 'photo');
      setUploadSuccessMsg('File uploaded to Supabase Storage!');
    }
    setUploading(false);
  };

  const handleNoticeFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];

    setUploading(true);
    const { url } = await uploadFileToStorage(file, 'notices', 'announcements');
    if (url) {
      setNoticeMediaUrl(url);
      setNoticeMediaType(file.type.startsWith('video/') ? 'video' : 'photo');
    }
    setUploading(false);
  };

  const handleSaveMedia = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaTitle.trim() || !mediaUrlInput.trim()) return;

    db.saveMediaItem({
      title: mediaTitle.trim(),
      description: mediaDescription.trim(),
      file_url: mediaUrlInput.trim(),
      media_type: mediaType,
      tag: mediaTag,
      uploaded_by: 'Staff Administrator',
    });

    refresh();
    setShowMediaModal(false);
    setMediaTitle('');
    setMediaDescription('');
    setMediaUrlInput('');
    setUploadSuccessMsg(null);
  };

  const handleDeleteMedia = (id: string) => {
    if (window.confirm('Delete this media file?')) {
      db.deleteMediaItem(id);
      refresh();
    }
  };

  const handleSaveNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle.trim() || !noticeContent.trim()) return;

    db.saveNotice({
      title: noticeTitle.trim(),
      category: noticeCategory,
      content: noticeContent.trim(),
      media_url: noticeMediaUrl.trim() || undefined,
      media_type: noticeMediaType,
      is_pinned: noticePinned,
      is_published: true,
    });

    refresh();
    setShowNoticeModal(false);
    setNoticeTitle('');
    setNoticeContent('');
    setNoticeMediaUrl('');
  };

  const handleDeleteNotice = (id: string) => {
    if (window.confirm('Delete this notice?')) {
      db.deleteNotice(id);
      refresh();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-lg font-bold text-slate-800">Media, Photos, Videos & Notices</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center space-x-1">
              <Database className="w-3 h-3" />
              <span>Supabase Storage Connected</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Store promotional banners, pharmacy videos, official notices, and media assets in your Supabase project (<code>njiojrpqihbarnotdewi</code>).
          </p>
        </div>

        {/* Tab Controls & Add Buttons */}
        <div className="flex items-center space-x-2">
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('media')}
              className={`px-3 py-1.5 font-bold rounded-lg transition-all ${
                activeTab === 'media' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Media Gallery ({mediaList.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('notices')}
              className={`px-3 py-1.5 font-bold rounded-lg transition-all ${
                activeTab === 'notices' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Public Notices ({noticeList.length})
            </button>
          </div>

          {activeTab === 'media' ? (
            <button
              type="button"
              onClick={() => setShowMediaModal(true)}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Upload Media</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowNoticeModal(true)}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create Notice</span>
            </button>
          )}
        </div>
      </div>

      {/* Media Gallery Tab */}
      {activeTab === 'media' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {mediaList.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col justify-between group hover:shadow-md transition-shadow"
              >
                <div>
                  {/* Media Preview Box */}
                  <div className="relative aspect-video bg-slate-900 overflow-hidden">
                    {item.media_type === 'video' ? (
                      item.file_url.includes('youtube') || item.file_url.includes('vimeo') ? (
                        <div className="w-full h-full flex items-center justify-center text-white text-xs">
                          <Film className="w-8 h-8 text-emerald-400" />
                        </div>
                      ) : (
                        <video
                          src={item.file_url}
                          controls
                          className="w-full h-full object-cover"
                        />
                      )
                    ) : (
                      <img
                        src={item.file_url}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          // Fallback placeholder
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=80';
                        }}
                      />
                    )}
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900/80 text-white backdrop-blur-xs uppercase">
                      {item.media_type}
                    </span>
                  </div>

                  <div className="p-4 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-emerald-700 uppercase">
                        {item.tag || 'General'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {formatDate(item.created_at)}
                      </span>
                    </div>
                    <h3 className="font-bold text-xs text-slate-800 line-clamp-1">{item.title}</h3>
                    {item.description && (
                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                  <a
                    href={item.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] font-semibold text-emerald-700 hover:underline flex items-center space-x-1"
                  >
                    <span>Open URL</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <button
                    type="button"
                    onClick={() => handleDeleteMedia(item.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded"
                    title="Delete Media"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notices Tab */}
      {activeTab === 'notices' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {noticeList.map((notice) => (
              <div
                key={notice.id}
                className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800">
                      {notice.category}
                    </span>
                    <div className="flex items-center space-x-2 text-[10px] text-slate-400">
                      {notice.is_pinned && (
                        <span className="font-bold text-amber-600">Pinned Notice</span>
                      )}
                      <span>{formatDate(notice.created_at)}</span>
                    </div>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 mt-2">{notice.title}</h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{notice.content}</p>

                  {/* Attached Media */}
                  {notice.media_url && (
                    <div className="mt-3 rounded-xl overflow-hidden aspect-video max-h-48 bg-slate-100 border border-slate-200">
                      <img
                        src={notice.media_url}
                        alt="Notice attachment"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-emerald-700 font-semibold">
                    Published to Public Website
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteNotice(notice.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Media Modal */}
      <Modal
        isOpen={showMediaModal}
        onClose={() => setShowMediaModal(false)}
        title="Upload Photo or Video to Supabase Storage"
        maxWidth="md"
      >
        <form onSubmit={handleSaveMedia} className="space-y-4 text-xs">
          {/* File Picker */}
          <div className="border-2 border-dashed border-slate-300 rounded-2xl p-5 text-center space-y-2 hover:bg-slate-50 transition-colors">
            <input
              type="file"
              id="media-file-picker"
              accept="image/*,video/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <label htmlFor="media-file-picker" className="cursor-pointer block space-y-1">
              <Upload className="w-7 h-7 text-slate-400 mx-auto" />
              <span className="font-bold text-emerald-700 block">
                {uploading ? 'Uploading to Supabase Storage...' : 'Click to select photo or video file'}
              </span>
              <span className="text-[10px] text-slate-400 block">
                Uploads directly to project <code>njiojrpqihbarnotdewi</code>
              </span>
            </label>
          </div>

          {uploadSuccessMsg && (
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 text-[11px] font-bold flex items-center space-x-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{uploadSuccessMsg}</span>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Title / Caption *</label>
            <input
              type="text"
              required
              value={mediaTitle}
              onChange={(e) => setMediaTitle(e.target.value)}
              placeholder="e.g. Pharmacy Cleanroom, Delivery Fleet..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Media Type</label>
              <select
                value={mediaType}
                onChange={(e) => setMediaType(e.target.value as MediaType)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl"
              >
                <option value="photo">Photo / Image</option>
                <option value="video">Video</option>
                <option value="document">Document</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tag / Group</label>
              <input
                type="text"
                value={mediaTag}
                onChange={(e) => setMediaTag(e.target.value)}
                placeholder="e.g. Storefront, Products"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Media URL (Supabase CDN or External Link) *
            </label>
            <input
              type="url"
              required
              value={mediaUrlInput}
              onChange={(e) => setMediaUrlInput(e.target.value)}
              placeholder="https://njiojrpqihbarnotdewi.supabase.co/storage/v1/object/public/..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-[11px]"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={2}
              value={mediaDescription}
              onChange={(e) => setMediaDescription(e.target.value)}
              placeholder="Brief summary..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowMediaModal(false)}
              className="px-4 py-2 bg-slate-100 rounded-xl font-semibold text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold"
            >
              Save to Media Gallery
            </button>
          </div>
        </form>
      </Modal>

      {/* Create Notice Modal */}
      <Modal
        isOpen={showNoticeModal}
        onClose={() => setShowNoticeModal(false)}
        title="Publish Pharmacy Notice or Announcement"
        maxWidth="md"
      >
        <form onSubmit={handleSaveNotice} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Notice Headline *</label>
            <input
              type="text"
              required
              value={noticeTitle}
              onChange={(e) => setNoticeTitle(e.target.value)}
              placeholder="e.g. Free Blood Pressure Checkups Every Friday"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Category</label>
            <select
              value={noticeCategory}
              onChange={(e) => setNoticeCategory(e.target.value as any)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl"
            >
              <option value="General">General Notice</option>
              <option value="Healthcare">Healthcare & Clinical Advice</option>
              <option value="Discount & Offer">Discounts, Cashback & Offers</option>
              <option value="Regulatory">Regulatory & DGDA Notices</option>
              <option value="Holiday">Holiday Hours</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Notice Content *</label>
            <textarea
              rows={3}
              required
              value={noticeContent}
              onChange={(e) => setNoticeContent(e.target.value)}
              placeholder="Provide full announcement details..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl"
            />
          </div>

          {/* Optional Attachment */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Attach Notice Image / Banner (Optional)
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="file"
                id="notice-file-picker"
                accept="image/*"
                onChange={handleNoticeFileUpload}
                className="hidden"
              />
              <label
                htmlFor="notice-file-picker"
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer text-slate-700 font-bold shrink-0"
              >
                {uploading ? 'Uploading...' : 'Choose Banner'}
              </label>
              <input
                type="url"
                value={noticeMediaUrl}
                onChange={(e) => setNoticeMediaUrl(e.target.value)}
                placeholder="Or paste image URL"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-[11px]"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              id="notice_pinned"
              checked={noticePinned}
              onChange={(e) => setNoticePinned(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded"
            />
            <label htmlFor="notice_pinned" className="font-semibold text-slate-700 cursor-pointer">
              Pin to top of public homepage
            </label>
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowNoticeModal(false)}
              className="px-4 py-2 bg-slate-100 rounded-xl font-semibold text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold"
            >
              Publish Notice
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
