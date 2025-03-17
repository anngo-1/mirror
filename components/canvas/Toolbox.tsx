import React, { useState, useRef, useEffect } from 'react';
import { DrawingTool } from './types';
import {
  ActionIcon,
  ColorPicker,
  Collapse,
  Divider,
  Flex,
  Group,
  Paper,
  Popover,
  Slider,
  Stack,
  Switch,
  Text,
  Tooltip
} from '@mantine/core';
import { 
  IconChevronLeft, 
  IconChevronRight, 
  IconEraser, 
  IconPencil, 
  IconZoomIn, 
  IconZoomOut,
  IconPalette,
  IconLayoutGrid,
  IconGripVertical
} from '@tabler/icons-react';

interface ToolboxProps {
  currentTool: DrawingTool;
  currentColor: string;
  currentWidth: number;
  zoomLevel: number;
  eraserRadius: number;
  setEraserRadius: (radius: number) => void;
  onToolSelect: (tool: DrawingTool) => void;
  onColorChange: (color: string) => void;
  onWidthChange: (width: number) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  // Background and grid props
  backgroundColor?: string;
  onBackgroundColorChange?: (color: string) => void;
  showGrid?: boolean;
  onToggleGrid?: (show: boolean) => void;
  gridColor?: string;
  onGridColorChange?: (color: string) => void;
}

const Toolbox: React.FC<ToolboxProps> = ({
  currentTool,
  currentColor,
  currentWidth,
  zoomLevel,
  eraserRadius,
  setEraserRadius,
  onToolSelect,
  onColorChange,
  onWidthChange,
  onZoomIn,
  onZoomOut,
  backgroundColor = '#000000',
  onBackgroundColorChange = () => {},
  showGrid = false,
  onToggleGrid = () => {},
  gridColor = 'rgba(255, 255, 255, 0.1)',
  onGridColorChange = () => {}
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [position, setPosition] = useState({ x: 30, y: 120 }); // Default position lower
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const toolboxRef = useRef<HTMLDivElement>(null);
  
  // Premium color palette
  const swatches = [
    '#f8f9fa', '#dee2e6', '#6c757d', '#343a40', 
    '#7209b7', '#4361ee', '#4cc9f0', '#06d6a0', 
    '#ffd166', '#ef476f'
  ];
  
  // Background colors
  const bgSwatches = [
    '#000000', '#080820', '#13132a', '#1a1a40', 
    '#2d2d64', '#121212', '#0a0a14'
  ];
  
  // Grid colors
  const gridSwatches = [
    'rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.2)', 
    'rgba(6, 214, 160, 0.2)', 'rgba(255, 105, 180, 0.2)', 
    'rgba(100, 149, 237, 0.2)'
  ];

  const toolbarWidth = isCollapsed ? 48 : 220;

  // Dragging functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    if (toolboxRef.current) {
      const rect = toolboxRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      setIsDragging(true);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  return (
    <Paper
      ref={toolboxRef}
      p={isCollapsed ? "xs" : "md"}
      radius="md"
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        width: toolbarWidth,
        transition: isDragging ? 'none' : 'width 0.3s ease',
        backgroundColor: 'rgba(25, 25, 50, 0.7)',
        zIndex: 1000,
        boxShadow: '0 8px 16px rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(6, 214, 160, 0.2)',
        cursor: isDragging ? 'grabbing' : 'auto'
      }}
    >
      {!isCollapsed ? (
        <Flex gap="xs" align="center" mb="md" 
          style={{ cursor: 'grab' }} 
          onMouseDown={handleMouseDown}
        >
          <IconGripVertical size={16} color="rgba(255, 255, 255, 0.5)" style={{ cursor: 'grab' }} />
          
          <Text 
            size="sm" 
            fw={700} 
            c="#06d6a0" 
            style={{ 
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              flexGrow: 1
            }}
          >
            Draw
          </Text>
          
          <ActionIcon 
            variant="subtle" 
            color="gray"
            onClick={() => setIsCollapsed(true)}
          >
            <IconChevronLeft size={16} />
          </ActionIcon>
        </Flex>
      ) : (
        <Stack gap="md" align="center" mb="xs">
          <Flex w="100%" justify="center" style={{ cursor: 'grab' }} onMouseDown={handleMouseDown}>
            <IconGripVertical size={16} color="rgba(255, 255, 255, 0.5)" style={{ cursor: 'grab' }} />
          </Flex>
          
          <ActionIcon 
            variant="subtle" 
            color="gray"
            onClick={() => setIsCollapsed(false)}
          >
            <IconChevronRight size={16} />
          </ActionIcon>
        </Stack>
      )}

      <Collapse in={!isCollapsed} animateOpacity>
        <Stack gap="md">
          {/* Tool Selection */}
          <Group gap="xs" grow>
            <Tooltip label="Pen Tool" position="right" withArrow>
              <ActionIcon 
                size="lg"
                variant={currentTool === 'pen' ? 'filled' : 'subtle'}
                color={currentTool === 'pen' ? 'teal' : 'gray'}
                onClick={() => onToolSelect('pen')}
                radius="md"
                style={{
                  backgroundColor: currentTool === 'pen' ? '#06d6a0' : 'rgba(255, 255, 255, 0.08)',
                  color: currentTool === 'pen' ? '#13132a' : 'white'
                }}
              >
                <IconPencil size={18} stroke={1.5} />
              </ActionIcon>
            </Tooltip>
            
            <Tooltip label="Eraser Tool" position="right" withArrow>
              <ActionIcon 
                size="lg"
                variant={currentTool === 'delete' ? 'filled' : 'subtle'}
                color={currentTool === 'delete' ? 'red' : 'gray'}
                onClick={() => onToolSelect('delete')}
                radius="md"
                style={{
                  backgroundColor: currentTool === 'delete' ? 'rgba(239, 71, 111, 0.8)' : 'rgba(255, 255, 255, 0.08)',
                  color: 'white'
                }}
              >
                <IconEraser size={18} stroke={1.5} />
              </ActionIcon>
            </Tooltip>
          </Group>

          <Divider color="rgba(255, 255, 255, 0.1)" />

          {/* Drawing Settings */}
          <Stack gap="sm">
            <Text size="xs" fw={600} tt="uppercase" c="rgba(255, 255, 255, 0.5)">Brush</Text>
            
            {/* Color Picker */}
            <Popover position="right" shadow="md" withArrow>
              <Popover.Target>
                <Flex align="center" gap="xs" style={{ cursor: 'pointer' }}>
                  <IconPalette size={16} color="rgba(255, 255, 255, 0.7)" />
                  <Text size="xs" fw={500} c="rgba(255, 255, 255, 0.9)">Color</Text>
                  <div 
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 6,
                      backgroundColor: currentColor,
                      marginLeft: 'auto',
                      border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}
                  />
                </Flex>
              </Popover.Target>
              <Popover.Dropdown bg="rgba(19, 19, 42, 0.95)" style={{ border: '1px solid rgba(6, 214, 160, 0.3)' }}>
                <ColorPicker
                  format="hex"
                  value={currentColor}
                  onChange={onColorChange}
                  swatches={swatches}
                  withPicker
                  size="sm"
                  styles={{
                    preview: { borderColor: 'rgba(255, 255, 255, 0.2)' },
                    body: { backgroundColor: 'rgba(19, 19, 42, 0.8)' },
                    thumb: { borderColor: '#06d6a0' }
                  }}
                />
              </Popover.Dropdown>
            </Popover>
            
            {/* Brush Size */}
            <Stack gap={6}>
              <Flex align="center" justify="space-between">
                <Text size="xs" fw={500} c="rgba(255, 255, 255, 0.9)">Size</Text>
                <Text size="xs" c="rgba(255, 255, 255, 0.6)">{currentWidth}px</Text>
              </Flex>
              <Slider
                min={1}
                max={30}
                step={1}
                value={currentWidth}
                onChange={onWidthChange}
                size="xs"
                label={null}
                thumbSize={14}
                color="teal"
                styles={{
                  track: { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
                  thumb: { backgroundColor: '#06d6a0', borderColor: '#06d6a0' },
                  bar: { backgroundColor: 'rgba(6, 214, 160, 0.6)' }
                }}
              />
            </Stack>

            {/* Eraser Radius - Only shown when eraser is selected */}
              {currentTool === 'delete' && (
                <Stack gap={6}>
                  <Flex align="center" justify="space-between">
                    <Text size="xs" fw={500} c="rgba(255, 255, 255, 0.9)">Eraser Size</Text>
                    <Text size="xs" c="rgba(255, 255, 255, 0.6)">{eraserRadius}px</Text>
                  </Flex>
                  <Slider
                    min={8}
                    max={300}
                    step={2}
                    value={eraserRadius}
                    onChange={setEraserRadius}
                    size="xs"
                    label={null}
                    thumbSize={14}
                    color="pink"
                    styles={{
                      track: { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
                      thumb: { backgroundColor: '#ef476f', borderColor: '#ef476f' },
                      bar: { backgroundColor: 'rgba(239, 71, 111, 0.6)' }
                    }}
                  />
                </Stack>
              )}
          </Stack>

          <Divider color="rgba(255, 255, 255, 0.1)" />

          {/* Canvas Settings */}
          <Stack gap="sm">
            <Text size="xs" fw={600} tt="uppercase" c="rgba(255, 255, 255, 0.5)">Canvas</Text>
            
            {/* Background Color */}
            <Popover position="right" shadow="md" withArrow>
              <Popover.Target>
                <Flex align="center" gap="xs" style={{ cursor: 'pointer' }}>
                  <Text size="xs" fw={500} c="rgba(255, 255, 255, 0.9)">Background</Text>
                  <div 
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 6,
                      backgroundColor: backgroundColor,
                      marginLeft: 'auto',
                      border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}
                  />
                </Flex>
              </Popover.Target>
              <Popover.Dropdown bg="rgba(19, 19, 42, 0.95)" style={{ border: '1px solid rgba(6, 214, 160, 0.3)' }}>
                <ColorPicker
                  format="hex"
                  value={backgroundColor}
                  onChange={onBackgroundColorChange}
                  swatches={bgSwatches}
                  withPicker
                  size="sm"
                  styles={{
                    preview: { borderColor: 'rgba(255, 255, 255, 0.2)' },
                    body: { backgroundColor: 'rgba(19, 19, 42, 0.8)' },
                    thumb: { borderColor: '#06d6a0' }
                  }}
                />
              </Popover.Dropdown>
            </Popover>
            
            {/* Grid Toggle and Color */}
            <Flex align="center" justify="space-between">
              <Flex align="center" gap="xs">
                <IconLayoutGrid size={16} color="rgba(255, 255, 255, 0.7)" />
                <Text size="xs" fw={500} c="rgba(255, 255, 255, 0.9)">Grid</Text>
              </Flex>
              <Flex align="center" gap="xs">
                {showGrid && (
                  <Popover position="right" shadow="md" withArrow>
                    <Popover.Target>
                      <div
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: 4,
                          backgroundColor: gridColor,
                          cursor: 'pointer',
                          border: '1px solid rgba(255, 255, 255, 0.2)'
                        }}
                      />
                    </Popover.Target>
                    <Popover.Dropdown bg="rgba(19, 19, 42, 0.95)" style={{ border: '1px solid rgba(6, 214, 160, 0.3)' }}>
                      <ColorPicker
                        format="rgba"
                        value={gridColor}
                        onChange={onGridColorChange}
                        swatches={gridSwatches}
                        withPicker
                        size="sm"
                        styles={{
                          preview: { borderColor: 'rgba(255, 255, 255, 0.2)' },
                          body: { backgroundColor: 'rgba(19, 19, 42, 0.8)' },
                          thumb: { borderColor: '#06d6a0' }
                        }}
                      />
                    </Popover.Dropdown>
                  </Popover>
                )}
                <Switch 
                  size="xs"
                  checked={showGrid}
                  onChange={(event) => onToggleGrid(event.currentTarget.checked)}
                  color="teal"
                  styles={{
                    track: { 
                      backgroundColor: showGrid ? 'rgba(6, 214, 160, 0.5)' : 'rgba(255, 255, 255, 0.2)',
                      borderColor: showGrid ? 'rgba(6, 214, 160, 0.8)' : 'rgba(255, 255, 255, 0.3)'
                    },
                    thumb: { 
                      backgroundColor: showGrid ? '#06d6a0' : 'white' 
                    }
                  }}
                />
              </Flex>
            </Flex>
          </Stack>

          <Divider color="rgba(255, 255, 255, 0.1)" />

          {/* Zoom Controls */}
          <Flex align="center" justify="space-between">
            <Text size="xs" fw={500} c="rgba(255, 255, 255, 0.9)">Zoom</Text>
            <Flex align="center" gap="xs">
              <Text size="xs" c="rgba(255, 255, 255, 0.6)">{Math.round(zoomLevel * 100)}%</Text>
              <ActionIcon 
                size="sm" 
                variant="subtle" 
                onClick={onZoomOut} 
                radius="md"
                style={{ color: 'rgba(255, 255, 255, 0.7)' }}
              >
                <IconZoomOut size={14} stroke={1.5} />
              </ActionIcon>
              <ActionIcon 
                size="sm" 
                variant="subtle" 
                onClick={onZoomIn} 
                radius="md"
                style={{ color: 'rgba(255, 255, 255, 0.7)' }}
              >
                <IconZoomIn size={14} stroke={1.5} />
              </ActionIcon>
            </Flex>
          </Flex>
        </Stack>
      </Collapse>

      {/* Mini toolbar when collapsed */}
      {isCollapsed && (
        <Stack gap="md" align="center" mt={10}>
          <Tooltip label="Pen Tool" position="right" withArrow>
            <ActionIcon 
              size="md"
              variant={currentTool === 'pen' ? 'filled' : 'subtle'}
              style={{
                backgroundColor: currentTool === 'pen' ? '#06d6a0' : 'rgba(255, 255, 255, 0.08)',
                color: currentTool === 'pen' ? '#13132a' : 'white'
              }}
              onClick={() => onToolSelect('pen')}
              radius="md"
            >
              <IconPencil size={16} stroke={1.5} />
            </ActionIcon>
          </Tooltip>
          
          <Tooltip label="Eraser Tool" position="right" withArrow>
            <ActionIcon 
              size="md"
              variant={currentTool === 'delete' ? 'filled' : 'subtle'}
              style={{
                backgroundColor: currentTool === 'delete' ? 'rgba(239, 71, 111, 0.8)' : 'rgba(255, 255, 255, 0.08)',
                color: 'white'
              }}
              onClick={() => onToolSelect('delete')}
              radius="md"
            >
              <IconEraser size={16} stroke={1.5} />
            </ActionIcon>
          </Tooltip>
          
          <Tooltip label="Brush Color" position="right" withArrow>
            <Popover position="right" shadow="md" withArrow>
              <Popover.Target>
                <div 
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    backgroundColor: currentColor,
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    cursor: 'pointer'
                  }}
                />
              </Popover.Target>
              <Popover.Dropdown bg="rgba(19, 19, 42, 0.95)" style={{ border: '1px solid rgba(6, 214, 160, 0.3)' }}>
                <ColorPicker
                  format="hex"
                  value={currentColor}
                  onChange={onColorChange}
                  swatches={swatches}
                  withPicker
                  size="sm"
                  styles={{
                    preview: { borderColor: 'rgba(255, 255, 255, 0.2)' },
                    body: { backgroundColor: 'rgba(19, 19, 42, 0.8)' },
                    thumb: { borderColor: '#06d6a0' }
                  }}
                />
              </Popover.Dropdown>
            </Popover>
          </Tooltip>
          
          <Divider w="60%" color="rgba(255, 255, 255, 0.1)" />
          
          <Tooltip label="Zoom In" position="right" withArrow>
            <ActionIcon 
              size="md" 
              variant="subtle" 
              onClick={onZoomIn} 
              radius="md"
              style={{ color: 'rgba(255, 255, 255, 0.7)' }}
            >
              <IconZoomIn size={16} stroke={1.5} />
            </ActionIcon>
          </Tooltip>
          
          <Tooltip label="Zoom Out" position="right" withArrow>
            <ActionIcon 
              size="md" 
              variant="subtle" 
              onClick={onZoomOut} 
              radius="md"
              style={{ color: 'rgba(255, 255, 255, 0.7)' }}
            >
              <IconZoomOut size={16} stroke={1.5} />
            </ActionIcon>
          </Tooltip>
        </Stack>
      )}
    </Paper>
  );
};

export default Toolbox;
