import React, { useState, useEffect } from 'react';
import './FamilyTree.css';

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

interface FamilyTreeProps {
  apiUrl: string;
  onMemberClick?: (member: FamilyMember) => void;
}

const FamilyTree: React.FC<FamilyTreeProps> = ({ apiUrl, onMemberClick }) => {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSpouse, setShowSpouse] = useState<Set<string>>(new Set());
  const [showChildren, setShowChildren] = useState<Set<string>>(new Set());

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/familyTree`);
      const data = await response.json();
      setMembers(data.members || []);
    } catch (error) {
      console.error('Error fetching family members:', error);
    }
    setLoading(false);
  };

  const fetchMemberById = async (id: string) => {
    try {
      const response = await fetch(`${apiUrl}/familyTree/${id}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error(`Error fetching member ${id}:`, error);
    }
    return null;
  };

  const fetchRootMembers = async () => {
    setLoading(true);
    try {
      const [member1, member2] = await Promise.all([
        fetch(`${apiUrl}/familyTree/1`).then((r) => (r.ok ? r.json() : null)),
        fetch(`${apiUrl}/familyTree/2`).then((r) => (r.ok ? r.json() : null)),
      ]);

      if (member1 && member2) {
        // Set member1 and member2 as married to each other
        member1.marriedTo = '2';
        member2.marriedTo = '1';

        // Fetch all members to get children and other relatives
        const response = await fetch(`${apiUrl}/familyTree`);
        const data = await response.json();
        const allMembers = data.members || [];

        // Replace members 1 and 2 with our updated versions
        const otherMembers = allMembers.filter(
          (m: FamilyMember) => m.id !== '1' && m.id !== '2'
        );
        setMembers([member1, member2, ...otherMembers]);
      } else {
        // Fallback to all members
        const response = await fetch(`${apiUrl}/familyTree`);
        const data = await response.json();
        setMembers(data.members || []);
      }
    } catch (error) {
      console.error('Error fetching root members:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRootMembers();
  }, []);

  const getMemberById = (id: string) => members.find((m) => m.id === id);

  const getSpouse = (member: FamilyMember) => {
    if (!member.marriedTo) return null;
    return getMemberById(member.marriedTo);
  };

  const getChildren = (parentId: string, spouseId?: string) => {
    const children = members.filter(
      (m) =>
        m.mom === parentId ||
        m.dad === parentId ||
        (spouseId && (m.mom === spouseId || m.dad === spouseId))
    );

    // Sort by birthday (oldest first)
    return children.sort(
      (a, b) => new Date(a.birthday).getTime() - new Date(b.birthday).getTime()
    );
  };

  const toggleSpouse = (memberId: string) => {
    const newShowSpouse = new Set(showSpouse);
    if (newShowSpouse.has(memberId)) {
      newShowSpouse.delete(memberId);
    } else {
      newShowSpouse.add(memberId);
    }
    setShowSpouse(newShowSpouse);
  };

  const toggleChildren = (memberId: string) => {
    const newShowChildren = new Set(showChildren);
    if (newShowChildren.has(memberId)) {
      newShowChildren.delete(memberId);
    } else {
      newShowChildren.add(memberId);
    }
    setShowChildren(newShowChildren);
  };

  const renderMember = (
    member: FamilyMember,
    showButtons = true,
    isInline = false
  ) => {
    const spouse = getSpouse(member);
    const children = getChildren(member.id, spouse?.id);
    const isSpouseShown = showSpouse.has(member.id);

    return (
      <div className={`member-container ${isInline ? 'inline' : ''}`}>
        <div
          key={member.id}
          className="member"
          onClick={() => onMemberClick?.(member)}
        >
          <div className="member-name">
            {member.name} {member.surname?.charAt(0) || ''}.
          </div>
          {member.nickname && (
            <div className="member-nickname">({member.nickname})</div>
          )}
          <div className="member-info">
            {member.gender} • {new Date(member.birthday).getFullYear()}
          </div>
          {showButtons && (
            <div className="member-buttons">
              {spouse && (
                <button
                  className="icon-btn"
                  title={isSpouseShown ? 'Eşi Gizle' : 'Eşi Göster'}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSpouse(member.id);
                  }}
                >
                  {isSpouseShown ? '💔' : '💑'}
                </button>
              )}
              {children.length > 0 && (
                <button
                  className="icon-btn"
                  title={
                    showChildren.has(member.id)
                      ? 'Çocukları Gizle'
                      : 'Çocukları Göster'
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleChildren(member.id);
                  }}
                >
                  {showChildren.has(member.id) ? '👶❌' : '👶'}
                </button>
              )}
            </div>
          )}
        </div>

        {isSpouseShown && spouse && (
          <>
            <div className="marriage-line-inline"></div>
            {renderMember(spouse, false, true)}
          </>
        )}
      </div>
    );
  };

  const renderMemberWithRelations = (member: FamilyMember) => {
    const spouse = getSpouse(member);
    const children = getChildren(member.id, spouse?.id);
    const isSpouseShown = showSpouse.has(member.id);
    const hasChildren = showChildren.has(member.id) && children.length > 0;

    return (
      <div key={`relations-${member.id}`} className="member-relations">
        {renderMember(member)}

        {hasChildren && (
          <div className="children-section">
            {isSpouseShown && spouse ? (
              <div className="parent-arrow-from-couple"></div>
            ) : (
              <div className="parent-arrow-from-single"></div>
            )}
            <div className="children">
              {children.map((child) => renderMemberWithRelations(child))}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return <div className="loading">Yükleniyor...</div>;
  }

  if (members.length === 0) {
    return (
      <div className="loading">
        <p>Henüz aile üyesi bulunamadı.</p>
        <p>Veritabanında veri olduğundan emin olun.</p>
      </div>
    );
  }

  console.log('All members:', members);

  // Always start with member ID "1" as the primary root
  const member1 = getMemberById('1');
  console.log('Found member1:', member1);

  if (!member1) {
    return (
      <div className="loading">
        <p>Member with ID "1" not found.</p>
        <p>
          Available members:{' '}
          {members.map((m) => `${m.id}:${m.name}`).join(', ')}
        </p>
      </div>
    );
  }

  return (
    <div className="family-tree">{renderMemberWithRelations(member1)}</div>
  );
};

export default FamilyTree;
