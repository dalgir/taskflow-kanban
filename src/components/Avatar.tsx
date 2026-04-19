import React, { useRef } from 'react';
import { Camera } from 'lucide-react';
import { TeamMember } from '../types';
import { useApp } from '../contexts/AppContext';

interface AvatarProps {
  member: TeamMember;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  editable?: boolean;
  showCamera?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-lg',
  lg: 'w-12 h-12 text-xl',
  xl: 'w-16 h-16 text-2xl',
};

const cameraSizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
};

export const Avatar: React.FC<AvatarProps> = ({
  member,
  size = 'md',
  editable = false,
  showCamera = false,
  className = '',
}) => {
  const { updateTeamMember, isAdmin } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canEdit = editable && isAdmin();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Verificar se é uma imagem
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione uma imagem válida.');
      return;
    }

    // Verificar tamanho (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 2MB.');
      return;
    }

    // Converter para base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      updateTeamMember(member.id, { avatarUrl: base64 });
    };
    reader.readAsDataURL(file);
  };

  const handleClick = () => {
    if (canEdit && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <div
        className={`
          ${sizeClasses[size]} 
          rounded-full 
          overflow-hidden 
          flex items-center justify-center
          ${member.avatarUrl ? '' : 'bg-gradient-to-br from-blue-400 to-blue-600'}
          ${canEdit ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}
        `}
        onClick={handleClick}
      >
        {member.avatarUrl ? (
          <img
            src={member.avatarUrl}
            alt={member.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span>{member.avatar}</span>
        )}
      </div>

      {/* Ícone de câmera para edição */}
      {showCamera && canEdit && (
        <div
          className={`
            absolute -bottom-1 -right-1 
            bg-blue-600 text-white 
            rounded-full p-1 
            cursor-pointer 
            hover:bg-blue-700 
            transition-colors
            shadow-lg
          `}
          onClick={handleClick}
        >
          <Camera className={cameraSizeClasses[size]} />
        </div>
      )}

      {/* Input de arquivo oculto */}
      {canEdit && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      )}
    </div>
  );
};

// Componente para exibir avatar pequeno em cards/listas
export const AvatarSmall: React.FC<{ member: TeamMember; className?: string }> = ({
  member,
  className = '',
}) => {
  return (
    <div
      className={`
        w-6 h-6 
        rounded-full 
        overflow-hidden 
        flex items-center justify-center 
        text-xs
        ${member.avatarUrl ? '' : 'bg-gradient-to-br from-blue-400 to-blue-600'}
        ${className}
      `}
    >
      {member.avatarUrl ? (
        <img
          src={member.avatarUrl}
          alt={member.name}
          className="w-full h-full object-cover"
        />
      ) : (
        <span>{member.avatar}</span>
      )}
    </div>
  );
};

export default Avatar;
