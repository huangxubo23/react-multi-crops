import React, { Component } from 'react';
import { both, clone, is, complement, equals, map, addIndex, isEmpty } from 'ramda';
import PropTypes from 'prop-types';
import shortid from 'shortid';
import Crop, { coordinateType } from './Crop';


const isValidPoint = (point = {}) => {
  const strictNumber = number => both(
    is(Number),
    complement(equals(NaN)),
  )(number);
  return strictNumber(point.x) && strictNumber(point.y);
};


class MultiCrops extends Component {
  drawingIndex = -1

  pointA = {}
  pointB = {}

  id = shortid.generate()

  isValidCount = () => {
    const { maxLimit, coordinates } = this.props;
    if (!maxLimit) return true;
    return maxLimit > coordinates.length;
  }

  renderCrops = (props) => {
    const indexedMap = addIndex(map);
    return indexedMap((coor, index) =>
      (<Crop
        // improve performance when delet crop in middle array
        key={coor.id || index}
        index={index}
        coordinate={coor}
        {...props}
      />))(props.coordinates);
  }

  getCursorPosition = (e) => {
    const { left, top } = this.container.getBoundingClientRect();
    return {
      x: e.clientX - left,
      y: e.clientY - top,
    };
  }

  generateCrop = (pointA, pointB) => {
    const { onDraw, onChange, coordinates, minWidth, minHeight } = this.props;
    if (this.isValidCount() && isValidPoint(pointA) && isValidPoint(pointB)) {
      // get the drawing coordinate
      const width = Math.abs(pointA.x - pointB.x) < minWidth ? minWidth : Math.abs(pointA.x - pointB.x);
      const height = Math.abs(pointA.y - pointB.y) < minHeight ? minHeight : Math.abs(pointA.y - pointB.y);
      const coordinate = {
        x: Math.min(pointA.x, pointB.x),
        y: Math.min(pointA.y, pointB.y),
        width,
        height,
        id: this.id,
      };
      const nextCoordinates = clone(coordinates);
      nextCoordinates[this.drawingIndex] = coordinate;
      if (is(Function, onDraw)) {
        onDraw(coordinate, this.drawingIndex, nextCoordinates);
      }
      if (is(Function, onChange)) {
        onChange(coordinate, this.drawingIndex, nextCoordinates);
      }
    }
  }

  handleMouseDown = (e) => {
    if (!this.isValidCount()) return;

    const { coordinates } = this.props;
    if (e.target === this.img || e.target === this.container) {
      const { x, y } = this.getCursorPosition(e);


      this.drawingIndex = coordinates.length;
      this.pointA = { x, y };
      this.id = shortid.generate();
    }
  }

  handleMouseMove = (e) => {
    if (this.isValidCount() && isValidPoint(this.pointA)) {
      const { x, y } = this.getCursorPosition(e);
      this.pointB = { x, y };
      this.generateCrop(this.pointA, this.pointB);
    }
  }

  handlMouseUp = (e) => {
    if (!this.isValidCount()) {
      if (!isEmpty(this.pointA)) {
        this.pointA = {};
      }
    }
    if ((e.target === this.img || e.target === this.container) && isEmpty(this.pointB)) {
      const { x, y } = this.getCursorPosition(e);
      this.pointB = { x, y };
      if (equals(this.pointA, this.pointB)) {
        this.generateCrop(this.pointA, this.pointB);
      }
    }
    this.pointA = {};
    this.pointB = {};
  }

  render() {
    const {
      src, width, height, onLoad,
    } = this.props;
    // const { clicked } = this.state
    return (
      <div
        style={{
          display: 'inline-block',
          position: 'relative',
        }}
        onMouseDown={this.handleMouseDown}
        onMouseMove={this.handleMouseMove}
        onMouseUp={this.handlMouseUp}
        ref={container => this.container = container}
      >
        <img
          ref={img => this.img = img}
          src={src}
          width={width}
          height={height}
          onLoad={onLoad}
          alt=""
          draggable={false}
        />
        {this.renderCrops(this.props)}

      </div>
    );
  }
}

const {
  string, arrayOf, number, func,
} = PropTypes;

MultiCrops.propTypes = {
  coordinates: arrayOf(coordinateType),
  src: string,
  width: number, // eslint-disable-line
  height: number, // eslint-disable-line
  minWidth: number, // eslint-disable-line
  minHeight: number, // eslint-disable-line
  maxLimit: number,  // eslint-disable-line
  onDraw: func, // eslint-disable-line
  onChange: func, // eslint-disable-line
  onLoad: func, // eslint-disable-line
};
MultiCrops.defaultProps = {
  coordinates: [],
  src: '',
};

export default MultiCrops;

