import { useMemo } from 'react';
import DOMPurify from 'dompurify';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  height?: number;
}

const modules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ indent: '-1' }, { indent: '+1' }],
    ['link', 'image'],
    ['clean'],
  ],
};

const formats = [
  'header',
  'bold',
  'italic',
  'underline',
  'strike',
  'list',
  'bullet',
  'indent',
  'link',
  'image',
];

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Tulis konten di sini...',
  readOnly = false,
  height = 300,
}: RichTextEditorProps) {
  const modulesWithHeight = useMemo(
    () => ({
      ...modules,
      toolbar: {
        ...modules.toolbar,
      },
    }),
    []
  );

  const handleChange = (content: string) => {
    const clean = DOMPurify.sanitize(content);
    onChange(clean);
  };

  return (
    <div style={{ position: 'relative' }}>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={handleChange}
        modules={modulesWithHeight}
        formats={formats}
        placeholder={placeholder}
        readOnly={readOnly}
        style={{
          height: height,
          marginBottom: '2.25rem',
        }}
      />
      {readOnly && (
        <style>{`
          .ql-toolbar { display: none; }
          .ql-container { border: none; }
          .ql-editor { padding: 0; }
          .ql-editor.ql-blank::before { display: none; }
        `}</style>
      )}
    </div>
  );
}

// Sanitize HTML - remove script tags, event handlers, javascript: URLs
function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'span', 'div', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
  });
}

// Minimal editor for previews/listings
export function RichTextPreview({ content }: { content: string }) {
  const clean = sanitizeHtml(content);
  return (
    <div
      className="rich-text-preview"
      style={{
        fontSize: '0.875rem',
        lineHeight: 1.6,
        color: '#374151',
      }}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
