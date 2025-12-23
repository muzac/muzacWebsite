import React, { useState } from 'react';

interface FamilyMember {
  id: string;
  name: string;
  surname: string;
  nickname?: string;
  birthday: string;
  marriedTo?: string;
  mom: string;
  dad: string;
  gender: 'Male' | 'Female';
  photo: string[];
}

interface FamilyTreeNodeProps {
  member: FamilyMember;
  apiUrl: string;
  onMemberClick?: (member: FamilyMember) => void;
}

const FamilyTreeNode: React.FC<FamilyTreeNodeProps> = ({
  member,
  apiUrl,
  onMemberClick,
}) => {
  const [showChildren, setShowChildren] = useState(false);
  const [showParents, setShowParents] = useState(false);
  const [children, setChildren] = useState<FamilyMember[]>([]);
  const [parents, setParents] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchChildren = async () => {
    if (children.length > 0) {
      setShowChildren(!showChildren);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${apiUrl}/familyTree/children/${member.id}`
      );
      const data = await response.json();
      setChildren(data.children || []);
      setShowChildren(true);
    } catch (error) {
      console.error('Error fetching children:', error);
    }
    setLoading(false);
  };

  const fetchParents = async () => {
    if (parents.length > 0) {
      setShowParents(!showParents);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/familyTree/parents/${member.id}`);
      const data = await response.json();
      setParents(data.parents || []);
      setShowParents(true);
    } catch (error) {
      console.error('Error fetching parents:', error);
    }
    setLoading(false);
  };

  return (
    <div
      style={{
        margin: '10px',
        padding: '10px',
        border: '1px solid #ccc',
        borderRadius: '8px',
        backgroundColor: '#f9f9f9',
      }}
    >
      <div
        style={{ cursor: 'pointer', fontWeight: 'bold' }}
        onClick={() => onMemberClick?.(member)}
      >
        {member.name} {member.surname.charAt(0)}.
        {member.nickname && ` (${member.nickname})`}
      </div>
      <div style={{ fontSize: '0.9em', color: '#666' }}>
        {member.gender} •{' '}
        {new Date(member.birthday).toLocaleDateString('tr-TR')}
      </div>

      <div style={{ marginTop: '10px' }}>
        <button
          onClick={fetchParents}
          disabled={loading}
          style={{
            marginRight: '5px',
            padding: '5px 10px',
            fontSize: '0.8em',
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          {showParents ? 'Ebeveynleri Gizle' : 'Ebeveynleri Göster'}
        </button>

        <button
          onClick={fetchChildren}
          disabled={loading}
          style={{
            padding: '5px 10px',
            fontSize: '0.8em',
            backgroundColor: '#27ae60',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          {showChildren ? 'Çocukları Gizle' : 'Çocukları Göster'}
        </button>
      </div>

      {showParents && parents.length > 0 && (
        <div
          style={{
            marginLeft: '20px',
            marginTop: '10px',
            borderLeft: '2px solid #3498db',
            paddingLeft: '10px',
          }}
        >
          <strong>Ebeveynler:</strong>
          {parents.map((parent) => (
            <FamilyTreeNode
              key={parent.id}
              member={parent}
              apiUrl={apiUrl}
              onMemberClick={onMemberClick}
            />
          ))}
        </div>
      )}

      {showChildren && children.length > 0 && (
        <div
          style={{
            marginLeft: '20px',
            marginTop: '10px',
            borderLeft: '2px solid #27ae60',
            paddingLeft: '10px',
          }}
        >
          <strong>Çocuklar:</strong>
          {children.map((child) => (
            <FamilyTreeNode
              key={child.id}
              member={child}
              apiUrl={apiUrl}
              onMemberClick={onMemberClick}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FamilyTreeNode;
