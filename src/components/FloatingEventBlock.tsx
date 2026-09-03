//FloatingEventBlock.tsx
import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { FloatingEventBlockProps } from '../types';

export const FloatingEventBlock: React.FC<FloatingEventBlockProps> = ({
  event,
  style,
  onPress,
  onEditPress,
  isOverlapping = false,
  overlapInfo,
}) => {
  const blockStyle: ViewStyle = {
    position: 'absolute',
    top: style.top + 1,
    left: style.left,
    width: style.width,
    height: style.height - 2,
    backgroundColor: event.color || '#e3f2fd',
    borderRadius: isOverlapping ? 4 : 6,
    borderWidth: isOverlapping ? 1.5 : 1,
    borderColor: event.textColor || '#1976d2',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: isOverlapping ? 0.15 : 0.1,
    shadowRadius: isOverlapping ? 3 : 2,
    elevation: isOverlapping ? 4 : 3,
  };

  const hasSpace = style.height > 24;
  const hasMoreSpace = style.height > 36;
  const hasFullSpace = style.height > 48;
  
  const titleFontSize = isOverlapping ? (style.width < 100 ? 10 : 11) : 12;
  const timeFontSize = isOverlapping ? 7 : 8;
  const descriptionFontSize = isOverlapping ? 7 : 8;

  if (!event || !event.title) {
    return null;
  }

  return (
    <TouchableOpacity
      style={blockStyle}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.eventContent}>
        <Text
          style={[
            styles.eventTitle,
            { 
              color: event.textColor || '#1976d2',
              fontSize: titleFontSize,
            },
            !hasSpace && styles.smallTitle
          ]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {event.title || 'Untitled Event'}
        </Text>

        {hasSpace && style.width > 70 && (
          <Text
            style={[
              styles.eventTime,
              { 
                color: event.textColor || '#1976d2',
                fontSize: timeFontSize,
              }
            ]}
            numberOfLines={1}
            ellipsizeMode="middle"
          >
            {event.startTime} - {event.endTime}
          </Text>
        )}

        {hasFullSpace && event.description && style.width > 100 && (
          <Text
            style={[
              styles.eventDescription,
              { 
                color: event.textColor || '#1976d2',
                fontSize: descriptionFontSize,
              }
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {event.description}
          </Text>
        )}

        {hasFullSpace && event.category && style.width > 90 && (
          <View style={styles.categoryContainer}>
            <Text
              style={[
                styles.categoryText,
                { 
                  color: event.textColor || '#1976d2',
                  fontSize: descriptionFontSize - 1,
                }
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              📁 {event.category}
            </Text>
          </View>
        )}

        {isOverlapping && overlapInfo && (
          <View style={styles.overlapIndicator}>
            <Text style={[styles.overlapText, { color: event.textColor || '#1976d2' }]}>
              {overlapInfo.column + 1}/{overlapInfo.totalColumns}
            </Text>
          </View>
        )}
      </View>

      {onEditPress && (
        <TouchableOpacity 
          style={[
            styles.editIndicator,
            isOverlapping && styles.editIndicatorSmall
          ]}
          onPress={(e) => {
            e.stopPropagation();
            onEditPress();
          }}
          activeOpacity={0.7}
          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
        >
          <Text style={[
            styles.editIcon,
            { fontSize: isOverlapping ? 9 : 10 }
          ]}>
            ✏️
          </Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  eventContent: {
    flex: 1,
    padding: 3,
    paddingRight: 22,
    overflow: 'hidden',
  },
  eventTitle: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 13,
    marginBottom: 0,
    textAlign: 'left',
    includeFontPadding: false,
    textAlignVertical: 'top',
  },
  smallTitle: {
    fontSize: 10,
    lineHeight: 11,
    marginBottom: 0,
  },
  eventTime: {
    fontSize: 8,
    fontWeight: '500',
    opacity: 0.8,
    marginBottom: 0,
    marginTop: 1,
    includeFontPadding: false,
    textAlignVertical: 'top',
    textAlign: 'left',
  },
  eventDescription: {
    fontSize: 8,
    opacity: 0.7,
    marginBottom: 0,
    lineHeight: 9,
    marginTop: 1,
    includeFontPadding: false,
    textAlignVertical: 'top',
    textAlign: 'left',
  },
  categoryContainer: {
    marginTop: 1,
    overflow: 'hidden',
  },
  categoryText: {
    fontSize: 7,
    fontWeight: '500',
    opacity: 0.7,
    includeFontPadding: false,
    textAlignVertical: 'top',
    textAlign: 'left',
  },
  editIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.15,
    shadowRadius: 1,
    elevation: 2,
  },
  editIndicatorSmall: {
    width: 16,
    height: 16,
    borderRadius: 8,
    top: 1,
    right: 1,
  },
  editIcon: {
    fontSize: 10,
    includeFontPadding: false,
  },
  overlapIndicator: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 6,
    paddingHorizontal: 3,
    paddingVertical: 1,
  },
  overlapText: {
    fontSize: 7,
    fontWeight: '600',
    opacity: 0.8,
  },
});