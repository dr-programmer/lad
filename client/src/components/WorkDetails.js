import React from 'react';
import styled from '@emotion/styled';
import { motion, AnimatePresence } from 'framer-motion';

const ModalOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled(motion.div)`
  background: linear-gradient(135deg, #16213e 0%, #1a1a2e 100%);
  border-radius: 15px;
  padding: 2rem;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  color: white;
  box-shadow: 0 0 20px rgba(74, 144, 226, 0.3);
`;

const Title = styled.h2`
  color: #4a90e2;
  margin-bottom: 1rem;
  font-size: 1.8rem;
`;

const Author = styled.h3`
  color: #fff;
  margin-bottom: 1rem;
  font-size: 1.2rem;
  opacity: 0.8;
`;

const Quote = styled.blockquote`
  border-left: 4px solid #4a90e2;
  padding-left: 1rem;
  margin: 1rem 0;
  font-style: italic;
  color: #fff;
  opacity: 0.9;
`;

const Summary = styled.p`
  line-height: 1.6;
  margin: 1rem 0;
  color: #fff;
  opacity: 0.9;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  color: #fff;
  font-size: 1.5rem;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.2s;

  &:hover {
    opacity: 1;
  }
`;

const WorkDetails = ({ work, onClose }) => {
  if (!work) return null;

  return (
    <AnimatePresence>
      <ModalOverlay
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <ModalContent
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          onClick={e => e.stopPropagation()}
        >
          <CloseButton onClick={onClose}>×</CloseButton>
          <Title>{work.title}</Title>
          <Author>{work.author} • {work.year}</Author>
          <Quote>{work.quote}</Quote>
          <Summary>{work.summary}</Summary>
        </ModalContent>
      </ModalOverlay>
    </AnimatePresence>
  );
};

export default WorkDetails; 