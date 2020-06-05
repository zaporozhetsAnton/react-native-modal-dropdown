/**
 * Created by sohobloo on 16/9/13.
 */

'use strict';

import React, {
  Component,
} from 'react';

import {
  StyleSheet,
  Dimensions,
  View,
  Text,
  TouchableWithoutFeedback,
  TouchableNativeFeedback,
  TouchableOpacity,
  TouchableHighlight,
  Modal,
  ActivityIndicator,
  FlatList
} from 'react-native';

import PropTypes from 'prop-types';

const TOUCHABLE_ELEMENTS = [
  'TouchableHighlight',
  'TouchableOpacity',
  'TouchableWithoutFeedback',
  'TouchableNativeFeedback'
];

export default class ModalDropdown extends Component {
  static propTypes = {
    multipleAutoClose: PropTypes.bool,
    multiple: PropTypes.bool,
    disabled: PropTypes.bool,
    scrollEnabled: PropTypes.bool,
    defaultIndex: PropTypes.number,
    defaultValue: PropTypes.string,
    options: PropTypes.array,

    accessible: PropTypes.bool,
    animated: PropTypes.bool,
    showsVerticalScrollIndicator: PropTypes.bool,
    keyboardShouldPersistTaps: PropTypes.string,

    style: PropTypes.oneOfType([PropTypes.number, PropTypes.object, PropTypes.array]),
    textStyle: PropTypes.oneOfType([PropTypes.number, PropTypes.object, PropTypes.array]),
    dropdownStyle: PropTypes.oneOfType([PropTypes.number, PropTypes.object, PropTypes.array]),
    dropdownTextStyle: PropTypes.oneOfType([PropTypes.number, PropTypes.object, PropTypes.array]),
    dropdownTextHighlightStyle: PropTypes.oneOfType([PropTypes.number, PropTypes.object, PropTypes.array]),

    adjustFrame: PropTypes.func,
    renderRow: PropTypes.func,
    renderSeparator: PropTypes.func,
    renderButtonText: PropTypes.func,

    onDropdownWillShow: PropTypes.func,
    onDropdownWillHide: PropTypes.func,
    onSelect: PropTypes.func
  };

  static defaultProps = {
    multipleAutoClose: true,
    multiple: false,
    disabled: false,
    scrollEnabled: true,
    defaultIndex: -1,
    defaultValue: 'Please select...',
    options: null,
    animated: true,
    showsVerticalScrollIndicator: true,
    keyboardShouldPersistTaps: 'never'
  };

  constructor(props) {
    super(props);

    this._button = null;
    this._buttonFrame = null;
    this._nextValue = null;
    this._nextIndex = null;

    this.state = {
      accessible: !!props.accessible,
      loading: !props.options,
      showDropdown: false,
      buttonText: props.defaultValue,
      selectedIndex: props.defaultIndex,
      valuesArray: [],
      indexesArray: []
    };

    this.select = this.select.bind(this)
    this.show = this.show.bind(this)
    this.hide = this.hide.bind(this)

    this.optionsList = React.createRef()
  }

  componentDidMount () {
    let { multiple, options, defaultMultipleArray } = this.props
    if (multiple && options && Array.isArray(options) && defaultMultipleArray && Array.isArray(defaultMultipleArray)) {
      let newValuesArray = []
      let newIndexesArray = []
      defaultMultipleArray.forEach( defOption => {
        if (options.includes(defOption)) {
          newValuesArray.push(defOption)
          newIndexesArray.push(options.indexOf(defOption))
        }
      })
      if (newValuesArray.length > 0) {
        this.setState({
          valuesArray: newValuesArray,
          indexesArray: newIndexesArray,
          buttonText: this.createMultipleButtonText(newValuesArray)
        })
      }
    }
  }

  // componentWillReceiveProps(nextProps) {
  //   let {buttonText, selectedIndex} = this.state;
  //   const {defaultIndex, defaultValue, options} = nextProps;
  //   buttonText = this._nextValue == null ? buttonText : this._nextValue;
  //   selectedIndex = this._nextIndex == null ? selectedIndex : this._nextIndex;
  //   if (selectedIndex < 0) {
  //     selectedIndex = defaultIndex;
  //     if (selectedIndex < 0) {
  //       buttonText = defaultValue;
  //     }
  //   }
  //   this._nextValue = null;
  //   this._nextIndex = null;
  //
  //   this.setState({
  //     loading: !options,
  //     buttonText,
  //     selectedIndex
  //   });
  // }

  render() {
    return (
      <View {...this.props}>
        {this._renderButton()}
        {this._renderModal()}
      </View>
    );
  }

  _updatePosition(callback) {
    if (this._button && this._button.measure) {
      this._button.measure((fx, fy, width, height, px, py) => {
        this._buttonFrame = {x: px, y: py, w: width, h: height};
        callback && callback();
      });
    }
  }

  show() {
    this._updatePosition(() => {
      this.setState({
        showDropdown: true
      });
    });
  }

  hide() {
    this.setState({
      showDropdown: false
    });
  }

  select(idx) {
    const {defaultValue, options, defaultIndex, renderButtonText, onMultipleSelect} = this.props;

    let value = defaultValue;
    if (idx == null || !options || idx >= options.length) {
      idx = defaultIndex;
    }

    if (idx >= 0) {
      value = renderButtonText ? renderButtonText(options[idx]) : options[idx].toString();
    }

    // this._nextValue = value;
    // this._nextIndex = idx;

    this.setState({
      buttonText: value,
      selectedIndex: idx
    });

    if (idx < 0 && this.props.multiple) {
      this.setState({
        valuesArray: [],
        indexesArray: [],
        buttonText: this.props.defaultValue
      })
      onMultipleSelect([])
    }
  }

  _renderButton() {
    const {disabled, accessible, children, textStyle} = this.props;
    const {buttonText} = this.state;

    return (
      <TouchableOpacity ref={button => this._button = button}
        disabled={disabled}
        accessible={accessible}
        onPress={this._onButtonPress}
      >
        {
          children ||
          (
            <View style={styles.button}>
              <Text style={[styles.buttonText, textStyle]}
                numberOfLines={1}
              >
                {buttonText}
              </Text>
            </View>
          )
        }
      </TouchableOpacity>
    );
  }

  _onButtonPress = () => {
    const {onDropdownWillShow} = this.props;
    if (!onDropdownWillShow ||
      onDropdownWillShow() !== false) {
      this.show();
    }
  };

  _renderModal() {
    const {animated, accessible, dropdownStyle} = this.props;
    const {showDropdown, loading} = this.state;
    if (showDropdown && this._buttonFrame) {
      const frameStyle = this._calcPosition();
      const animationType = animated ? 'fade' : 'none';
      return (
        <Modal animationType={animationType}
          visible={true}
          transparent={true}
          onRequestClose={this._onRequestClose}
          supportedOrientations={['portrait', 'portrait-upside-down', 'landscape', 'landscape-left', 'landscape-right']}
        >
          <TouchableWithoutFeedback accessible={accessible}
            disabled={!showDropdown}
            onPress={this._onModalPress}
          >
            <View style={styles.modal}>
              <View style={[styles.dropdown, dropdownStyle, frameStyle]}>
                {loading ? this._renderLoading() : this._renderDropdown()}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      );
    }
  }

  _calcPosition() {
    const {dropdownStyle, style, adjustFrame} = this.props;

    const dimensions = Dimensions.get('window');
    const windowWidth = dimensions.width;
    const windowHeight = dimensions.height;

    const dropdownHeight = (dropdownStyle && StyleSheet.flatten(dropdownStyle).height) ||
      StyleSheet.flatten(styles.dropdown).height;

    const bottomSpace = windowHeight - this._buttonFrame.y - this._buttonFrame.h;
    const rightSpace = windowWidth - this._buttonFrame.x;
    const showInBottom = bottomSpace >= dropdownHeight || bottomSpace >= this._buttonFrame.y;
    const showInLeft = rightSpace >= this._buttonFrame.x;

    const positionStyle = {
      height: dropdownHeight,
      top: showInBottom ? this._buttonFrame.y + this._buttonFrame.h : Math.max(0, this._buttonFrame.y - dropdownHeight),
    };

    if (showInLeft) {
      positionStyle.left = this._buttonFrame.x;
    } else {
      const dropdownWidth = (dropdownStyle && StyleSheet.flatten(dropdownStyle).width) ||
        (style && StyleSheet.flatten(style).width) || -1;
      if (dropdownWidth !== -1) {
        positionStyle.width = dropdownWidth;
      }
      positionStyle.right = rightSpace - this._buttonFrame.w;
    }

    return adjustFrame ? adjustFrame(positionStyle) : positionStyle;
  }

  _onRequestClose = () => {
    const {onDropdownWillHide} = this.props;
    if (!onDropdownWillHide ||
      onDropdownWillHide() !== false) {
      this.hide();
    }
  };

  _onModalPress = () => {
    const {onDropdownWillHide} = this.props;
    if (!onDropdownWillHide ||
      onDropdownWillHide() !== false) {
      this.hide();
    }
  };

  _renderLoading() {
    return (
      <ActivityIndicator size='small'/>
    );
  }

  _renderDropdown() {
    const {scrollEnabled, renderSeparator, showsVerticalScrollIndicator, keyboardShouldPersistTaps, options, noOptionsTextStyle} = this.props;
    return (
      <>
        {options.length > 0
          ? <FlatList
            ref={this.optionsList}
            scrollEnabled={scrollEnabled}
            style={styles.list}
            data={options}
            renderItem={this._renderRow}
            ItemSeparatorComponent={renderSeparator || this._renderSeparator}
            showsVerticalScrollIndicator={showsVerticalScrollIndicator}
            keyboardShouldPersistTaps={keyboardShouldPersistTaps}
            getItemLayout={(data, index) => {
              return {length: 38.5, index, offset: 38.5 * index}
            }}
            initialScrollIndex={(this.state.selectedIndex && this.props.autoScroll) ? this.state.selectedIndex : null}
            keyExtractor={(item, index) => index.toString()}
          />
          : <TouchableOpacity style={{ flex: 1 }}
          onPress={this._onModalPress}>
            <Text style={noOptionsTextStyle}>No options</Text>
          </TouchableOpacity>}
      </>
    )
  }

  _renderRow = ({ item, index }) => {
    const {renderRow, dropdownTextStyle, dropdownTextHighlightStyle, accessible, underlayColor} = this.props;
    const {selectedIndex} = this.state;
    const key = `row_${index}`;
    const highlighted = this.props.multiple ? this.state.indexesArray.includes(index) : index == selectedIndex;
    const row = !renderRow ?
      (<Text style={[
        styles.rowText,
        dropdownTextStyle,
        highlighted && styles.highlightedRowText,
        highlighted && dropdownTextHighlightStyle
      ]}
      >
        {item}
      </Text>) :
      renderRow(item, index, highlighted);
    const preservedProps = {
      key,
      accessible,
      onPress: () => this._onRowPress(item, index),
      underlayColor
    };
    if (TOUCHABLE_ELEMENTS.find(name => name == row.type.displayName)) {
      const props = {...row.props};
      props.key = preservedProps.key;
      props.onPress = preservedProps.onPress;
      props.underlayColor = preservedProps.underlayColor
      const {children} = row.props;
      switch (row.type.displayName) {
        case 'TouchableHighlight': {
          return (
            <TouchableHighlight {...props}>
              {children}
            </TouchableHighlight>
          );
        }
        case 'TouchableOpacity': {
          return (
            <TouchableOpacity {...props}>
              {children}
            </TouchableOpacity>
          );
        }
        case 'TouchableWithoutFeedback': {
          return (
            <TouchableWithoutFeedback {...props}>
              {children}
            </TouchableWithoutFeedback>
          );
        }
        case 'TouchableNativeFeedback': {
          return (
            <TouchableNativeFeedback {...props}>
              {children}
            </TouchableNativeFeedback>
          );
        }
        default:
          break;
      }
    }
    return (
      <TouchableHighlight {...preservedProps}>
        {row}
      </TouchableHighlight>
    );
  };

  createMultipleButtonText (options) {
    const { multiple, multipleButtonCreator, placeholder } = this.props
    if (multiple && multipleButtonCreator && options.length > 0) {
      return multipleButtonCreator(options)
    } else {
      return options.length ? `${options.length} option${options.length > 1 ? 's' : ''} selected` : placeholder
    }
  }

  _onRowPress(rowData, rowID) {
    const {onSelect, renderButtonText, onMultipleSelect, multipleAutoClose} = this.props;
    // highlightRow(sectionID, rowID);
    const value = renderButtonText && renderButtonText(rowData) || rowData.toString();
    if (this.props.multiple && onMultipleSelect) {
      let newValuesArray = [...this.state.valuesArray]
      let newIndexesArray = [...this.state.indexesArray]
      if (newValuesArray.includes(value)) {
        newValuesArray.splice(newValuesArray.indexOf(value), 1)
      } else {
        newValuesArray.push(value)
      }
      if (newIndexesArray.includes(rowID)) {
        newIndexesArray.splice(newIndexesArray.indexOf(rowID), 1)
      } else {
        newIndexesArray.push(rowID)
      }
      this.setState({
        valuesArray: newValuesArray,
        indexesArray: newIndexesArray,
        buttonText: this.createMultipleButtonText(newValuesArray)
      }, () => {
        onMultipleSelect(newValuesArray)
      });
      if (multipleAutoClose) {
        this._onRequestClose()
      }
    } else if (!onSelect || onSelect(rowID, rowData) !== false) {
      this.setState({
        buttonText: value,
        selectedIndex: rowID
      });
      this._onRequestClose()
    }
  }

  _renderSeparator = (sectionID, rowID, adjacentRowHighlighted) => {
    const key = `spr_${rowID}`;
    return (
      <View style={styles.separator}
            key={key}
      />
    );
  };
}

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center'
  },
  buttonText: {
    fontSize: 12
  },
  modal: {
    flexGrow: 1
  },
  dropdown: {
    position: 'absolute',
    height: (33 + StyleSheet.hairlineWidth) * 5,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'lightgray',
    borderRadius: 2,
    backgroundColor: 'white',
    justifyContent: 'center'
  },
  loading: {
    alignSelf: 'center'
  },
  list: {
    //flexGrow: 1,
  },
  rowText: {
    paddingHorizontal: 6,
    paddingVertical: 10,
    fontSize: 11,
    color: 'gray',
    backgroundColor: 'white',
    textAlignVertical: 'center'
  },
  highlightedRowText: {
    color: 'black'
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'lightgray'
  }
});
